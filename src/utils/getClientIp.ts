import { Request } from 'express';

/**
 * Resolve the end-customer IP when the API sits behind Cloudflare/nginx.
 * MobiPaid requires a valid shopper IP on payment requests.
 */
export const getClientIp = (req: Request): string | undefined => {
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
        return cfConnectingIp.trim();
    }

    const trueClientIp = req.headers['true-client-ip'];
    if (typeof trueClientIp === 'string' && trueClientIp.trim()) {
        return trueClientIp.trim();
    }

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded[0]) {
        return forwarded[0].split(',')[0].trim();
    }

    const ip = req.ip || req.socket.remoteAddress;
    if (!ip) return undefined;

    return ip.replace(/^::ffff:/, '');
};
