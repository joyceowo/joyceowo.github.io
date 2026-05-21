import type { APIRoute } from "astro";
import { PAGE_SIZE } from "@/constants/constants";
import { getSortedPostsList } from "@/utils/content-utils";

type SitemapEntry = {
	loc: string;
	lastmod?: string;
};

function toAbsoluteUrl(path: string) {
	return new URL(path, import.meta.env.SITE).href;
}

function formatLastMod(date: Date | undefined) {
	return date ? date.toISOString() : undefined;
}

function buildUrlEntry(entry: SitemapEntry) {
	const lastmod = entry.lastmod
		? `\n    <lastmod>${entry.lastmod}</lastmod>`
		: "";
	return `  <url>\n    <loc>${entry.loc}</loc>${lastmod}\n  </url>`;
}

export const GET: APIRoute = async () => {
	const zhPosts = await getSortedPostsList();
	const enPosts = await getSortedPostsList("en");

	const latestZhPost = zhPosts[0]?.data.updated ?? zhPosts[0]?.data.published;
	const latestEnPost = enPosts[0]?.data.updated ?? enPosts[0]?.data.published;

	const entries: SitemapEntry[] = [
		{ loc: toAbsoluteUrl("/"), lastmod: formatLastMod(latestZhPost) },
		{ loc: toAbsoluteUrl("/about/") },
		{ loc: toAbsoluteUrl("/archive/"), lastmod: formatLastMod(latestZhPost) },
		{ loc: toAbsoluteUrl("/en/"), lastmod: formatLastMod(latestEnPost) },
		{
			loc: toAbsoluteUrl("/en/archive/"),
			lastmod: formatLastMod(latestEnPost),
		},
	];

	for (let page = 2; page <= Math.ceil(zhPosts.length / PAGE_SIZE); page++) {
		entries.push({
			loc: toAbsoluteUrl(`/${page}/`),
			lastmod: formatLastMod(latestZhPost),
		});
	}

	for (let page = 2; page <= Math.ceil(enPosts.length / PAGE_SIZE); page++) {
		entries.push({
			loc: toAbsoluteUrl(`/en/${page}/`),
			lastmod: formatLastMod(latestEnPost),
		});
	}

	for (const post of zhPosts) {
		entries.push({
			loc: toAbsoluteUrl(`/posts/${post.slug}/`),
			lastmod: formatLastMod(post.data.updated ?? post.data.published),
		});
	}

	for (const post of enPosts) {
		entries.push({
			loc: toAbsoluteUrl(`/posts/${post.slug}/`),
			lastmod: formatLastMod(post.data.updated ?? post.data.published),
		});
	}

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries.map(buildUrlEntry),
		"</urlset>",
	].join("\n");

	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
		},
	});
};
