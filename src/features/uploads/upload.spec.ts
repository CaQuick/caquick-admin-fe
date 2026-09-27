import { HttpResponse, graphql } from 'msw';

import { server } from '@/test/msw/server';

import { uploadImage, validateImageFile } from './upload';

const file = (type: string, size = 1000) => new File([new Uint8Array(size)], 'a.png', { type });

describe('uploadImage', () => {
  it.each([
    ['image/gif', 1000, 'JPEG·PNG·WebP만 올릴 수 있습니다.'],
    ['image/png', 0, '빈 파일입니다.'],
    ['image/png', 5 * 1024 * 1024 + 1, '5MB 이하만 올릴 수 있습니다.'],
    ['image/webp', 1000, null],
  ])('%s %d bytes → %s', (type, size, expected) => {
    expect(validateImageFile(file(type, size))).toBe(expected);
  });

  it('발급 → PUT → publicUrl', async () => {
    let issued: unknown;
    server.use(
      graphql.mutation('AdminCreateUploadUrl', ({ variables }) => {
        issued = (variables as { input: unknown }).input;
        return HttpResponse.json({
          data: {
            adminCreateUploadUrl: {
              uploadUrl: 'https://s3.test/put',
              publicUrl: 'https://cdn.test/a.png',
              key: 'k',
              expiresInSeconds: 300,
            },
          },
        });
      }),
    );
    const put = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
    await expect(uploadImage('STORE_IMAGE', file('image/png', 1234), put)).resolves.toBe(
      'https://cdn.test/a.png',
    );
    expect(issued).toEqual({
      purpose: 'STORE_IMAGE',
      contentType: 'image/png',
      contentLength: 1234,
    });
    expect(put).toHaveBeenCalledWith(
      'https://s3.test/put',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('PUT 실패·네트워크 오류는 ApiError', async () => {
    server.use(
      graphql.mutation('AdminCreateUploadUrl', () =>
        HttpResponse.json({
          data: {
            adminCreateUploadUrl: { uploadUrl: 'u', publicUrl: 'p', key: 'k', expiresInSeconds: 1 },
          },
        }),
      ),
    );
    await expect(
      uploadImage('STORE_IMAGE', file('image/png'), () =>
        Promise.resolve(new Response(null, { status: 403 })),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      uploadImage('STORE_IMAGE', file('image/png'), () => Promise.reject(new Error('net'))),
    ).rejects.toMatchObject({ classification: 'NETWORK' });
    await expect(uploadImage('STORE_IMAGE', file('image/gif'))).rejects.toMatchObject({
      classification: 'BAD_USER_INPUT',
    });
  });
});
