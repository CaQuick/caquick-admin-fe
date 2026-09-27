import { graphql } from '@/graphql/generated';
import { type UploadPurpose } from '@/graphql/generated/graphql';
import { ApiError, gqlRequest } from '@/shared/api';

const AdminCreateUploadUrlDocument = graphql(/* GraphQL */ `
  mutation AdminCreateUploadUrl($input: AdminCreateUploadUrlInput!) {
    adminCreateUploadUrl(input: $input) {
      uploadUrl
      publicUrl
      key
      expiresInSeconds
    }
  }
`);

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type))
    return 'JPEG·PNG·WebP만 올릴 수 있습니다.';
  if (file.size < 1) return '빈 파일입니다.';
  if (file.size > MAX_BYTES) return '5MB 이하만 올릴 수 있습니다.';
  return null;
}

/**
 * presigned PUT 업로드. BE가 발급한 uploadUrl로 브라우저가 직접 S3에 올리고 publicUrl을 돌려준다.
 * publicUrl은 발급한 계정·용도로만 저장이 허용되므로 같은 세션에서 바로 저장 입력에 넣는다.
 */
export async function uploadImage(
  purpose: UploadPurpose,
  file: File,
  put: typeof fetch = fetch,
): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) throw new ApiError(invalid, 'BAD_USER_INPUT', null, 400);
  const { uploadUrl, publicUrl } = (
    await gqlRequest(AdminCreateUploadUrlDocument, {
      input: { purpose, contentType: file.type, contentLength: file.size },
    })
  ).adminCreateUploadUrl;
  let res: Response;
  try {
    res = await put(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type },
      body: file,
    });
  } catch {
    throw new ApiError('스토리지에 연결할 수 없습니다.', 'NETWORK', null, 0);
  }
  if (!res.ok)
    throw new ApiError(
      `이미지 업로드 실패 (${res.status})`,
      'INTERNAL_SERVER_ERROR',
      null,
      res.status,
    );
  return publicUrl;
}
