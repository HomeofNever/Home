import { error } from '@sveltejs/kit';
import { shortlinks } from '$lib/tiles';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () =>
  Object.keys(shortlinks).map((shortlink) => ({ shortlink }));

export const load: PageLoad = ({ params }) => {
  const target = shortlinks[params.shortlink];

  if (!target) {
    error(404, 'Shortlink not found');
  }

  return target;
};
