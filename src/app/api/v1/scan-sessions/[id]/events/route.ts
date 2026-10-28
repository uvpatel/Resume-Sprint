import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { ScanSessionRepository } from '@/server/persistence/repository';
import { EventService, eventBus } from '@/server/events/event.service';
import { ProgressEvent } from '@/types/resume-sprint';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const session = await ScanSessionRepository.findById(id);
    if (!session) {
      throw ApiError.notFound('Scan session');
    }

    if (session.userId !== user.id) {
      throw ApiError.forbidden();
    }

    const lastEventId = req.headers.get('last-event-id') || undefined;

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: ProgressEvent) => {
          if (isClosed) return;
          try {
            const data = `id: ${event.id}\nevent: progress\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // Controller closed
          }
        };

        // 1. Replay past events
        const pastEvents = await EventService.getEventsForReplay(id, lastEventId);
        for (const evt of pastEvents) {
          sendEvent(evt);
        }

        // 2. Real-time subscription
        const unsubscribe = eventBus.subscribe(id, (evt) => {
          sendEvent(evt);
        });

        // 3. Heartbeat timer
        const heartbeatInterval = setInterval(() => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // 4. Cleanup on client disconnect
        req.signal.addEventListener('abort', () => {
          isClosed = true;
          clearInterval(heartbeatInterval);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
      cancel() {
        isClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
