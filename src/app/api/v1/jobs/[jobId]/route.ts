import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, assertJobOwnership } from '@/lib/security/authorization';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { JobRepository, ExportArtifactRepository } from '@/server/persistence/repository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { jobId } = await params;

    const job = await JobRepository.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job');
    }

    assertJobOwnership(job, user.id);

    const download = req.nextUrl.searchParams.get('download');
    if (download === 'true' && job.result) {
      const resultObj = job.result as { artifactId?: string; fileName?: string };
      if (resultObj.artifactId) {
        const artifact = await ExportArtifactRepository.findById(resultObj.artifactId);
        if (!artifact) {
          throw ApiError.notFound('Export artifact');
        }

        if (new Date(artifact.expiresAt).getTime() < Date.now()) {
          throw ApiError.badRequest('Artifact download link has expired. Please export again.', 'Request a fresh export', 'ARTIFACT_EXPIRED');
        }

        const buffer = Buffer.from(artifact.fileBufferBase64, 'base64');
        const contentType = artifact.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        return new Response(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${artifact.fileName}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    }

    return NextResponse.json({
      jobId: job.jobId,
      sessionId: job.sessionId,
      type: job.type,
      status: job.status,
      progress: job.progress,
      snapshot: job.snapshot,
      result: job.result,
      error: job.error,
      artifactUrl: job.artifactUrl,
      artifactExpiresAt: job.artifactExpiresAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
