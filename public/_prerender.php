<?php
/**
 * Prerendered body markup, included from index.php into <div id="root">.
 *
 * React mounts with createRoot().render(), which replaces whatever is inside
 * the container — so this markup is purely what non-JS clients and crawlers
 * see, plus a first paint that matches the final render closely enough to
 * avoid a visible jump.
 *
 * Headings here must mirror the React components (same single <h1> per page),
 * otherwise the rendered snapshot Google keeps would differ from the raw HTML.
 *
 * Expects these from index.php: $view, $entity, $exhibitionsSorted,
 * $worksSorted, $newsSorted, $about, $contact, and the e()/format_date()
 * helpers.
 */

if (!function_exists('e')) {
    return;
}

$navItems = [
    '/'        => 'Home',
    '/news'    => 'News',
    '/works'   => 'Works',
    '/about'   => 'About',
    '/contact' => 'Contact',
];
?>
<div class="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
  <nav class="sticky top-0 bg-white z-50 border-b border-gray-200">
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-4">
      <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2 uppercase text-[11px] font-bold tracking-widest">
        <a href="/" class="w-full md:w-auto mb-4 md:mb-0 text-2xl md:text-xl font-bold text-black uppercase mr-auto tracking-normal block md:inline-block">PAVLO KOVACH</a>
<?php foreach ($navItems as $href => $label): ?>
        <a href="<?= e($href) ?>" class="hover:text-gray-500"><?= e($label) ?></a>
<?php endforeach; ?>
      </div>
    </div>
  </nav>
  <main class="flex-grow pb-24">
<?php if ($view === 'home'): ?>
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <h1 class="sr-only">Pavlo Kovach — exhibitions by the Ukrainian artist and curator</h1>
      <div class="space-y-32">
<?php foreach ($exhibitionsSorted as $item):
        $href = '/exhibition/' . rawurlencode((string) ($item['id'] ?? ''));
        $photo = first_media_url($item['photos'] ?? []); ?>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-gray-100 pb-24 last:border-0 last:pb-0">
          <div class="lg:col-span-8">
            <a href="<?= e($href) ?>" class="block group overflow-hidden bg-gray-100 border border-gray-200 relative aspect-[16/10]">
<?php if ($photo !== ''): ?>
              <img src="<?= e($photo) ?>" alt="<?= e($item['title'] ?? '') ?>" loading="lazy" class="w-full h-full object-cover" />
<?php endif; ?>
            </a>
          </div>
          <div class="lg:col-span-4 flex flex-col justify-end">
            <div class="border-t-2 border-black pt-4 mb-6">
              <div class="grid grid-cols-2 gap-4">
                <div><div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Date</div><div class="text-xs font-bold"><?= e(format_date($item['date'] ?? '')) ?></div></div>
                <div><div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Location</div><div class="text-xs font-bold"><?= e($item['location'] ?? '') ?></div></div>
              </div>
            </div>
            <a href="<?= e($href) ?>" class="group inline-block">
              <h2 class="text-4xl md:text-5xl font-bold mb-4 leading-none tracking-normal"><?= e($item['title'] ?? '') ?></h2>
            </a>
            <p class="text-sm leading-relaxed text-gray-700"><?= e(summarize($item['description'] ?? '', 300)) ?></p>
          </div>
        </div>
<?php endforeach; ?>
      </div>
    </div>
<?php elseif ($view === 'works'): ?>
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <h1 class="sr-only">Works by Pavlo Kovach</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-8">
<?php foreach ($worksSorted as $item):
        $href = '/works/' . rawurlencode((string) ($item['id'] ?? ''));
        $photo = first_media_url($item['media'] ?? []); ?>
        <a href="<?= e($href) ?>" class="flex flex-col group">
          <div class="aspect-square bg-gray-50 mb-6 border border-gray-200 overflow-hidden relative shadow-sm">
<?php if ($photo !== ''): ?>
            <img src="<?= e($photo) ?>" alt="<?= e($item['title'] ?? '') ?>" loading="lazy" class="w-full h-full object-contain" />
<?php endif; ?>
          </div>
          <div class="border-t border-black pt-4">
            <div class="flex justify-between items-start">
              <h2 class="text-xl font-bold leading-tight"><?= e($item['title'] ?? '') ?></h2>
              <span class="text-xs font-bold text-black"><?= e(format_date($item['date'] ?? '')) ?></span>
            </div>
            <p class="text-xs text-gray-700 mt-4 leading-relaxed"><?= e(summarize($item['description'] ?? '', 200)) ?></p>
          </div>
        </a>
<?php endforeach; ?>
      </div>
    </div>
<?php elseif ($view === 'news'): ?>
    <div class="max-w-[1000px] mx-auto px-4 md:px-8 py-12">
      <h1 class="sr-only">News and press about Pavlo Kovach</h1>
      <div class="space-y-16">
<?php foreach ($newsSorted as $item):
        $newsUrl = trim((string) ($item['url'] ?? ''));
        $isExternal = (bool) preg_match('#^https?://#i', $newsUrl); ?>
        <div class="flex flex-col md:flex-row gap-8 items-start">
          <div class="w-full md:w-1/3 aspect-video overflow-hidden bg-gray-100">
<?php if (!empty($item['photo'])): ?>
            <img src="<?= e($item['photo']) ?>" alt="<?= e($item['title'] ?? '') ?>" loading="lazy" class="w-full h-full object-cover grayscale" />
<?php endif; ?>
          </div>
          <div class="w-full md:w-2/3 border-t border-black pt-4">
            <div class="text-[10px] uppercase font-bold text-black mb-2">/ <?= e(format_date($item['date'] ?? '')) ?></div>
            <h2 class="text-3xl font-bold underline-offset-8">
<?php if ($isExternal): ?>
              <a href="<?= e($newsUrl) ?>" target="_blank" rel="noopener noreferrer"><?= e($item['title'] ?? '') ?></a>
<?php else: ?>
              <?= e($item['title'] ?? '') ?>
<?php endif; ?>
            </h2>
          </div>
        </div>
<?php endforeach; ?>
      </div>
    </div>
<?php elseif ($view === 'about'): ?>
    <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mt-4">
        <div class="md:col-span-4">
<?php if (!empty($about['photo'])): ?>
          <img src="<?= e($about['photo']) ?>" alt="Pavlo Kovach" loading="lazy" class="w-full grayscale mb-3" />
<?php endif; ?>
          <div class="border-t border-black pt-3">
<?php if (!empty($about['birthDate'])): ?>
            <div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Born</div>
            <div class="text-xs font-bold"><?= e($about['birthDate']) ?></div>
<?php endif; ?>
          </div>
        </div>
        <div class="md:col-span-8">
          <h1 class="sr-only">About Pavlo Kovach</h1>
          <div class="text-lg md:text-xl text-black leading-relaxed space-y-6 whitespace-pre-wrap font-medium border-b border-black pb-12 mb-12"><?= e($about['text'] ?? '') ?></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 class="text-2xl font-bold uppercase mb-6">/ Solo Exhibitions</h2>
              <ul class="space-y-3">
<?php foreach (($about['soloExhibitions'] ?? []) as $line): ?>
                <li class="text-xs uppercase leading-tight font-medium border-l-2 border-[#b20000] pl-4 py-1"><?= e(str_replace('-', '—', (string) $line)) ?></li>
<?php endforeach; ?>
              </ul>
            </div>
            <div>
              <h2 class="text-2xl font-bold uppercase mb-6">/ Group Exhibitions</h2>
              <ul class="space-y-3">
<?php foreach (($about['groupExhibitions'] ?? []) as $line): ?>
                <li class="text-xs uppercase leading-tight font-medium border-l-2 border-black pl-4 py-1"><?= e(str_replace('-', '—', (string) $line)) ?></li>
<?php endforeach; ?>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
<?php elseif ($view === 'contact'): ?>
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-8 flex items-center justify-center">
      <div class="w-full max-w-lg border border-gray-200 p-12 md:p-16 shadow-sm bg-white">
        <div class="mb-12">
          <h1 class="text-2xl font-bold tracking-tighter uppercase mb-1">Pavlo Kovach</h1>
          <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Artist / Curator</p>
        </div>
        <div class="space-y-8">
<?php if (!empty($contact['email'])): ?>
          <div class="flex flex-col gap-1">
            <span class="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Electronic Mail</span>
            <a href="mailto:<?= e($contact['email']) ?>" class="text-base md:text-lg font-medium lowercase"><?= e($contact['email']) ?></a>
          </div>
<?php endif; ?>
<?php if (!empty($contact['whatsapp'])): ?>
          <div class="flex flex-col gap-1">
            <span class="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Mobile / WhatsApp</span>
            <a href="tel:<?= e($contact['whatsapp']) ?>" class="text-base md:text-lg font-medium"><?= e($contact['whatsapp']) ?></a>
          </div>
<?php endif; ?>
<?php if (!empty($contact['facebook'])):
          $fb = (string) $contact['facebook'];
          $fbHref = str_starts_with($fb, 'http') ? $fb : 'https://facebook.com/' . ltrim($fb, '/'); ?>
          <div class="flex flex-col gap-1">
            <span class="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Facebook</span>
            <a href="<?= e($fbHref) ?>" target="_blank" rel="noopener noreferrer" class="text-base md:text-lg font-medium"><?= e($fb) ?></a>
          </div>
<?php endif; ?>
        </div>
      </div>
    </div>
<?php elseif ($view === 'work' && $entity !== null): ?>
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <div class="mb-12"><a href="/works" class="text-[10px] font-bold uppercase text-gray-400 tracking-widest">← BACK TO WORKS</a></div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div class="lg:col-span-8">
          <div class="aspect-video bg-gray-50 border border-gray-200 overflow-hidden relative shadow-inner flex items-center justify-center">
<?php $photo = first_media_url($entity['media'] ?? []);
      if ($photo !== ''): ?>
            <img src="<?= e($photo) ?>" alt="<?= e($entity['title']) ?>" class="w-full h-full object-contain" />
<?php endif; ?>
          </div>
        </div>
        <div class="lg:col-span-4 border-t-2 border-black pt-4">
          <h1 class="text-3xl md:text-4xl font-bold mb-6 leading-tight tracking-normal"><?= e($entity['title']) ?></h1>
          <div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Project Year</div>
          <div class="text-xs font-bold"><?= e(format_date($entity['date'] ?? '')) ?></div>
          <div class="mt-8 text-xl text-black leading-relaxed font-medium whitespace-pre-line"><?= e($entity['description'] ?? '') ?></div>
        </div>
      </div>
    </div>
<?php elseif ($view === 'exhibition' && $entity !== null): ?>
    <div class="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
      <h1 class="sr-only"><?= e($entity['title']) ?></h1>
      <div class="mb-12"><a href="/" class="text-[10px] font-bold uppercase text-gray-400 tracking-widest">← BACK TO LIST</a></div>
      <div class="flex gap-4 pb-8 overflow-hidden">
<?php foreach (array_slice($entity['photos'] ?? [], 0, 3) as $idx => $photo):
        if (($photo['type'] ?? 'image') !== 'image' || empty($photo['url'])) { continue; } ?>
        <div class="flex-shrink-0 w-full md:w-3/4 lg:w-2/3 h-[60vh] bg-gray-50 overflow-hidden border border-gray-200">
          <img src="<?= e($photo['url']) ?>" alt="<?= e($entity['title'] . ' - ' . $idx) ?>" class="w-full h-full object-cover" />
        </div>
<?php endforeach; ?>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 border-t border-black pt-12">
        <div class="lg:col-span-4 space-y-6">
          <div><div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Date</div><div class="text-xs font-bold"><?= e(format_date($entity['date'] ?? '')) ?></div></div>
          <div><div class="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Venue</div><div class="text-xs font-bold"><?= e($entity['location'] ?? '') ?></div></div>
        </div>
        <div class="lg:col-span-8">
          <div class="text-xl md:text-2xl text-black leading-relaxed font-medium whitespace-pre-line"><?= e($entity['description'] ?? '') ?></div>
        </div>
      </div>
    </div>
<?php elseif ($view === '404'): ?>
    <div class="max-w-[1000px] mx-auto px-4 md:px-8 py-24 text-center">
      <h1 class="text-3xl font-black uppercase tracking-tight mb-4">Page not found</h1>
      <p class="text-sm text-gray-600 mb-8">The page you requested does not exist.</p>
      <a href="/" class="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black">← Back to exhibitions</a>
    </div>
<?php endif; ?>
  </main>
</div>
