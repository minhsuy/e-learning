import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * TMDEMY — Secure Certificate PDF Proxy & Download Route
 *
 * Solves Cloudinary 401 ACL/deny restrictions by securely signing private download
 * requests server-side, streaming the genuine 100% binary PDF directly to the student's device.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const code = searchParams.get('code') || 'TMdemy';
  const isInline = searchParams.get('inline') === 'true';

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing certificate URL' }, { status: 400 });
  }

  const cleanCode = code.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Certificate_${cleanCode}.pdf`;

  try {
    let fetchUrl = targetUrl;

    // Check if Cloudinary URL
    if (targetUrl.includes('cloudinary.com')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dxostp23y';
      const apiKey = process.env.CLOUDINARY_API_KEY || '116242874491284';
      const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mQhK02-LzSgJ5ct4Iv0Egw0FeSA';

      // Extract public_id from Cloudinary URL (e.g. /upload/v12345/certificates/cert.pdf)
      const match = targetUrl.match(/\/upload\/(?:fl_[^/]+\/)?(?:v\d+\/)?(.+\.pdf)/i);
      const publicId = match ? match[1] : '';

      if (publicId && apiKey && apiSecret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}&type=upload${apiSecret}`;
        const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

        fetchUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?api_key=${apiKey}&public_id=${encodeURIComponent(
          publicId
        )}&signature=${signature}&timestamp=${timestamp}&type=upload`;
      }
    }

    const upstreamRes = await fetch(fetchUrl);

    if (!upstreamRes.ok) {
      console.error(`Upstream PDF fetch failed: ${upstreamRes.status} on ${fetchUrl}`);
      return NextResponse.json(
        { error: 'Failed to retrieve certificate from storage server' },
        { status: upstreamRes.status }
      );
    }

    const pdfBuffer = await upstreamRes.arrayBuffer();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error in certificate download proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving certificate PDF' },
      { status: 500 }
    );
  }
}
