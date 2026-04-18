import React from "react";
import Image from "next/image";
import {
  Comparison,
  ComparisonHandle,
  ComparisonItem,
} from "@/components/kibo-ui/comparison";
import {
  HeroDitheringRoot,
  HeroDitheringVisual,
} from "@/components/ui/hero-dithering";

type Example = {
  num: string;
  label: string;
  title: string;
  description: string;
  command: string;
  source: string;
  render: string;
  aspect: string;
  span: "full" | "half";
};

const PAPER = "#faf6ef";
const INK = "#0f0e0c";

const INSTALL_COMMANDS: { label: string; command: string }[] = [
  { label: "npx · zero-install", command: "npx agent-ascii ./screenshot.png --layout" },
  { label: "npm · global", command: "npm install --global agent-ascii" },
  { label: "go · from source", command: "go install github.com/Vinniai/agent-ascii@latest" },
  {
    label: "claude code · skill",
    command: "npx agent-ascii@latest skill:install",
  },
];

const FEATURED: Example = {
  num: "01",
  label: "layout · watch closeup",
  title: "Layout mode on a product hero",
  description:
    "Close crop of the Apple Watch hero card, rendered in --layout mode. Braille + adaptive contrast + dithering keeps the dial face, chart ring, and digital crown readable at width 100.",
  command: "agent-ascii apple-watch.png --width 100 --layout",
  source: "/examples/apple-watch-closeup.png",
  render: "/examples/site-01-watch-layout.png",
  aspect: "aspect-[3/2]",
  span: "full",
};

type DiffPair = {
  num: string;
  label: string;
  title: string;
  description: string;
  before: string;
  after: string;
  heatmap: string;
  grid: string;
  added: number;
  removed: number;
  modified: number;
  percent: string;
  hotspots: [string, number][];
};

const DIFF_ATLAS: DiffPair[] = [
  {
    num: "01",
    label: "webpage · natural pair",
    title: "Landing page · hero repositioned",
    description:
      "The two real landing-page captures from our test set. Dithering pushes the hero band into a different row, which shows up as green (added rows) below and red (removed rows) above.",
    before: "/examples/site-07-webpage-basic.png",
    after: "/examples/site-08-webpage-topthird.png",
    heatmap: "/examples/diff-webpage-heatmap.png",
    grid: "36 × 60",
    added: 427,
    removed: 313,
    modified: 309,
    percent: "48.6%",
    hotspots: [
      ["TC", 207],
      ["BL", 127],
      ["MC", 126],
      ["BC", 120],
    ],
  },
  {
    num: "02",
    label: "x-signup · added banner",
    title: "Signup form · added banner, dropped CTA",
    description:
      "A realistic state change — a new promo banner appears top-of-page, the CTA row is blanked. Green clusters at the banner, red across the bottom CTA band.",
    before: "/examples/diff-x-before.png",
    after: "/examples/diff-x-after.png",
    heatmap: "/examples/diff-x-heatmap.png",
    grid: "40 × 60",
    added: 343,
    removed: 90,
    modified: 662,
    percent: "45.6%",
    hotspots: [
      ["BC", 203],
      ["BL", 147],
      ["ML", 129],
      ["BR", 117],
    ],
  },
  {
    num: "03",
    label: "iphone · banner + masked stack",
    title: "iPhone lineup · new banner, masked lower stack",
    description:
      "The same recipe on a photo-heavy crop. Even here the heatmap isolates where ink disappeared (red, bottom half) from where new ink arrived (green, banner row).",
    before: "/examples/diff-iphone-before.png",
    after: "/examples/diff-iphone-after.png",
    heatmap: "/examples/diff-iphone-heatmap.png",
    grid: "46 × 60",
    added: 162,
    removed: 338,
    modified: 617,
    percent: "40.5%",
    hotspots: [
      ["BC", 208],
      ["BL", 176],
      ["TC", 145],
      ["TL", 142],
    ],
  },
  {
    num: "04",
    label: "watch · subtle change",
    title: "Watch hero · narrow banner only",
    description:
      "Smaller change, tighter grid. The diff keeps amber (modified) dominant — the ink density shifted but the silhouette mostly held. Good sanity check for false-positive noise.",
    before: "/examples/diff-watch-before.png",
    after: "/examples/diff-watch-after.png",
    heatmap: "/examples/diff-watch-heatmap.png",
    grid: "20 × 60",
    added: 63,
    removed: 49,
    modified: 456,
    percent: "47.3%",
    hotspots: [
      ["MC", 113],
      ["TC", 83],
      ["TR", 61],
      ["TL", 60],
    ],
  },
];

type Annotated = {
  num: string;
  label: string;
  title: string;
  file: string;
  aspect: string;
  added: number;
  removed: number;
  modified: number;
};

const ANNOTATED: Annotated[] = [
  {
    num: "01",
    label: "webpage · hero drift",
    title: "Landing page",
    file: "/examples/diff-webpage-annotated.png",
    aspect: "aspect-[5/7]",
    added: 427,
    removed: 313,
    modified: 309,
  },
  {
    num: "02",
    label: "x-signup · banner + dropped CTA",
    title: "Signup form",
    file: "/examples/diff-x-annotated.png",
    aspect: "aspect-[5/7]",
    added: 343,
    removed: 90,
    modified: 662,
  },
  {
    num: "03",
    label: "iphone · banner + masked stack",
    title: "iPhone lineup",
    file: "/examples/diff-iphone-annotated.png",
    aspect: "aspect-[5/7]",
    added: 162,
    removed: 338,
    modified: 617,
  },
  {
    num: "04",
    label: "watch · narrow banner",
    title: "Watch hero",
    file: "/examples/diff-watch-annotated.png",
    aspect: "aspect-[5/3]",
    added: 63,
    removed: 49,
    modified: 456,
  },
];

type DiffStrategy = {
  name: string;
  bytes: string;
  tokens: string;
  consumable: string;
  locates: string;
  emphasis?: boolean;
};

const DIFF_STRATEGIES: DiffStrategy[] = [
  {
    name: "unified text-diff",
    bytes: "10.0 KB",
    tokens: "5,891",
    consumable: "yes · text",
    locates: "line-accurate",
  },
  {
    name: "full coord list",
    bytes: "8.2 KB",
    tokens: "6,691",
    consumable: "yes · text",
    locates: "cell-accurate",
  },
  {
    name: "9-box summary",
    bytes: "30 B",
    tokens: "15",
    consumable: "yes · text",
    locates: "coarse ninths",
    emphasis: true,
  },
  {
    name: "two PNG renders",
    bytes: "15.4 KB",
    tokens: "~vision",
    consumable: "image only",
    locates: "via model attention",
  },
];

const DIFF_SNIPPET = `--- before
+++ after
@@ -1,5 +1,21 @@
-⡤⣾⣿⣿⣿⣿⣿⣿⣷⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
-⣟⣿⣿⣿⣿⣿⣿⣿⣟⣷⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶⣶
+⡤⣾⣿⣿⣿⣿⣿⣷⣶⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
+⣿⣿⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
+⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰
+⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣤⣤⣬`;

const EXAMPLES: Example[] = [
  {
    num: "02",
    label: "braille · watch",
    title: "Plain braille, same crop",
    description:
      "The same Apple Watch closeup rendered with --braille only. Denser ink, no adaptive contrast — shows what the raw 2×4 subpixel packing produces before layout tuning kicks in.",
    command: "agent-ascii apple-watch.png --width 100 --braille",
    source: "/examples/apple-watch-closeup.png",
    render: "/examples/site-02-watch-braille.png",
    aspect: "aspect-[3/2]",
    span: "half",
  },
  {
    num: "03",
    label: "layout · iphone lineup",
    title: "iPhone stack · layout mode",
    description:
      "Cropped to the iPhone lineup shot — three phones, Apple logos, buttons, headings. Layout mode keeps the CTA pills legible at width 60.",
    command: "agent-ascii apple-iphone.png --width 60 --layout",
    source: "/examples/apple-iphone-closeup.png",
    render: "/examples/site-03-iphone-layout.png",
    aspect: "aspect-[9/14]",
    span: "half",
  },
  {
    num: "04",
    label: "braille · iphone lineup",
    title: "iPhone stack · raw braille",
    description:
      "Same iPhone crop with --braille. You can still pick out the three handsets and the button row — useful when you only need silhouette structure.",
    command: "agent-ascii apple-iphone.png --width 60 --braille",
    source: "/examples/apple-iphone-closeup.png",
    render: "/examples/site-04-iphone-braille.png",
    aspect: "aspect-[9/14]",
    span: "half",
  },
  {
    num: "05",
    label: "layout · signup form",
    title: "X signup form · layout mode",
    description:
      "The Happening now signup, cropped to the form. Layout mode holds the wordmark, heading, and the Google/Apple/Create account button stack — exactly the UI primitives an agent needs to reason about.",
    command: "agent-ascii x-signup.png --width 60 --layout",
    source: "/examples/x-signup-closeup.png",
    render: "/examples/site-05-x-layout.png",
    aspect: "aspect-[9/12]",
    span: "half",
  },
  {
    num: "06",
    label: "braille · signup form",
    title: "X signup form · raw braille",
    description:
      "Same crop with --braille. Great contrast case: dark CTA pill reads crisp, light pills lose their interior labels. This is why --layout exists.",
    command: "agent-ascii x-signup.png --width 60 --braille",
    source: "/examples/x-signup-closeup.png",
    render: "/examples/site-06-x-braille.png",
    aspect: "aspect-[9/12]",
    span: "half",
  },
  {
    num: "07",
    label: "layout · webpage A",
    title: "Landing page baseline",
    description:
      "Synthetic landing page (nav, hero, three feature cards, footer) at width 80 in --layout mode. This becomes the baseline for the drift diff below.",
    command: "agent-ascii landing.png --width 80 --layout",
    source: "/examples/webpage-basic.png",
    render: "/examples/site-07-webpage-basic.png",
    aspect: "aspect-[5/6]",
    span: "half",
  },
];

function Rule({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-[color:var(--rule)] ${className}`} />;
}

function CommandLine({ command }: { command: string }) {
  return (
    <pre className="overflow-x-auto font-mono text-[13px] leading-[1.65] text-foreground">
      <span className="select-none text-[color:var(--ink-muted)]">$ </span>
      <code>{command}</code>
    </pre>
  );
}

function Eyebrow({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
      <span>{num}</span>
      <span aria-hidden className="h-px w-8 bg-[color:var(--rule)]" />
      <span>{children}</span>
    </div>
  );
}

function ExampleBlock({ ex }: { ex: Example }) {
  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Eyebrow num={ex.num}>{ex.label}</Eyebrow>
        <h3 className="font-mono text-xl tracking-tight text-foreground">
          {ex.title}
        </h3>
        <p className="max-w-[62ch] text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
          {ex.description}
        </p>
      </div>
      <CommandLine command={ex.command} />
      <Comparison
        mode="drag"
        className={`${ex.aspect} w-full overflow-hidden border border-[color:var(--rule)] bg-background`}
      >
        <ComparisonItem position="left">
          <Image
            src={ex.source}
            alt={`source: ${ex.source}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </ComparisonItem>
        <ComparisonItem position="right">
          <Image
            src={ex.render}
            alt={`ascii render: ${ex.render}`}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain"
          />
        </ComparisonItem>
        <ComparisonHandle />
        <div className="pointer-events-none absolute top-2 left-2 border border-[color:var(--rule)] bg-background/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--ink-muted)] backdrop-blur">
          source
        </div>
        <div className="pointer-events-none absolute top-2 right-2 border border-[color:var(--rule)] bg-background/90 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur">
          ascii
        </div>
      </Comparison>
    </article>
  );
}

export default function Home() {
  return (
    <div className="flex w-full flex-col bg-background text-foreground">
      {/* HERO */}
      <HeroDitheringRoot
        className="relative isolate border-b border-[color:var(--rule)]"
        srTitle="agent-ascii"
        desktopShaderProps={{
          colorBack: PAPER,
          colorFront: INK,
          shape: "swirl",
          type: "4x4",
          size: 2.2,
          speed: 0.45,
          scale: 0.8,
        }}
      >
        <HeroDitheringVisual
          className="absolute inset-0 -z-10 hidden h-full w-full lg:block"
          desktopClassName="absolute inset-0 h-full w-full rounded-none opacity-[0.45]"
        />
        {/* paper fade so type stays legible */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--paper), transparent 5%) 0%, color-mix(in oklch, var(--paper), transparent 40%) 55%, var(--paper) 100%)",
          }}
        />
        <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-between gap-16 px-6 pt-10 pb-16 md:px-10 md:pt-14 md:pb-20 lg:min-h-[80vh]">
          <header className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--ink-muted)]">
            <span>agent-ascii</span>
            <span className="hidden sm:inline">v1.1.0 · apache-2.0</span>
            <a
              href="https://github.com/Vinniai/agent-ascii"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline decoration-[color:var(--rule)] decoration-1 underline-offset-[6px] hover:decoration-foreground"
            >
              github ↗
            </a>
          </header>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-[color:var(--ink-muted)]">
                image → ascii, for agents
              </span>
              <h2 className="font-mono text-[clamp(2.8rem,10vw,8rem)] font-medium leading-[0.9] tracking-[-0.04em] text-foreground">
                agent
                <span className="text-[color:var(--accent)]">-</span>ascii
              </h2>
            </div>

            <div className="grid gap-10 md:grid-cols-12">
              <p className="md:col-span-7 max-w-[60ch] text-[17px] leading-[1.55] text-foreground">
                Convert images, screenshots, and GIFs into low-byte ASCII and
                braille renders. Framed layouts, visual diffs, and a{" "}
                <span className="underline decoration-[color:var(--accent)] decoration-2 underline-offset-4">
                  Claude Code skill
                </span>{" "}
                that keeps agent context cheap.
              </p>
              <div className="md:col-span-5 flex flex-col gap-3 md:items-end md:text-right">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                  quickstart
                </span>
                <code className="font-mono text-[14px] text-foreground">
                  $ npx agent-ascii ./shot.png --layout
                </code>
                <a
                  href="https://github.com/Vinniai/agent-ascii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] uppercase tracking-[0.22em] text-foreground underline decoration-[color:var(--accent)] decoration-2 underline-offset-[6px] hover:decoration-foreground"
                >
                  read the manual ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </HeroDitheringRoot>

      {/* INSTALL */}
      <section className="w-full">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-10 md:grid-cols-12 md:gap-12 md:py-24">
          <div className="md:col-span-4 flex flex-col gap-4">
            <Eyebrow num="01">install</Eyebrow>
            <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
              Up and running in one line.
            </h3>
            <p className="max-w-[52ch] text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Prebuilt binaries for macOS, Linux, and Windows ship through npm.
              No Go toolchain needed unless you&apos;re hacking on the source.
            </p>
          </div>

          <div className="md:col-span-8">
            <Rule />
            {INSTALL_COMMANDS.map((c) => (
              <div key={c.label} className="group">
                <div className="grid grid-cols-1 items-baseline gap-3 py-6 md:grid-cols-[14ch_1fr]">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                    {c.label}
                  </span>
                  <CommandLine command={c.command} />
                </div>
                <Rule />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="w-full border-t border-[color:var(--rule)] bg-[color:var(--secondary)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-4 flex flex-col gap-3">
              <Eyebrow num={FEATURED.num}>featured · {FEATURED.label}</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                {FEATURED.title}
              </h3>
            </div>
            <div className="md:col-span-8 flex flex-col gap-4">
              <p className="max-w-[62ch] text-[17px] leading-[1.6] text-foreground">
                {FEATURED.description}
              </p>
              <CommandLine command={FEATURED.command} />
            </div>
          </div>

          <Comparison
            mode="drag"
            className={`${FEATURED.aspect} w-full overflow-hidden border border-[color:var(--rule)] bg-background`}
          >
            <ComparisonItem position="left">
              <Image
                src={FEATURED.source}
                alt={`source: ${FEATURED.source}`}
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-contain"
              />
            </ComparisonItem>
            <ComparisonItem position="right">
              <Image
                src={FEATURED.render}
                alt={`ascii render: ${FEATURED.render}`}
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-contain"
              />
            </ComparisonItem>
            <ComparisonHandle />
            <div className="pointer-events-none absolute top-3 left-3 border border-[color:var(--rule)] bg-background/90 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--ink-muted)] backdrop-blur">
              source screenshot
            </div>
            <div className="pointer-events-none absolute top-3 right-3 border border-[color:var(--rule)] bg-background/90 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur">
              agent-ascii render
            </div>
          </Comparison>
        </div>
      </section>

      {/* MODES */}
      <section className="w-full border-t border-[color:var(--rule)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 flex flex-col gap-3">
              <Eyebrow num="02">closeups</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                Closer crops, richer renders.
              </h3>
            </div>
            <p className="md:col-span-7 max-w-[62ch] self-end text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Every block pairs a tightly cropped source with its agent-ascii
              render. Drag the handle to swipe between them — this is exactly
              what the model sees when the screenshot is handed over as context.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2">
            {EXAMPLES.map((ex) => (
              <ExampleBlock key={ex.num} ex={ex} />
            ))}
          </div>
        </div>
      </section>

      {/* DIFF ATLAS — red/green/amber heatmaps per pair */}
      <section className="w-full border-t border-[color:var(--rule)] bg-[color:var(--secondary)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 flex flex-col gap-3">
              <Eyebrow num="03">diff atlas</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                Red for gone, green for new.
              </h3>
            </div>
            <p className="md:col-span-7 max-w-[62ch] self-end text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Render two screenshots with the same flags, compare cell-by-cell,
              colour each changed cell by direction:{" "}
              <span className="text-[color:var(--remove)]">red</span> where ink
              disappeared,{" "}
              <span className="text-[color:var(--add)]">green</span> where it
              arrived,{" "}
              <span className="text-[color:var(--accent)]">amber</span> where it
              shifted in place. Four pairs, same width, same preset.
            </p>
          </div>

          <CommandLine command="agent-ascii diff before.png after.png --width 60 --layout" />

          <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 bg-[color:var(--add)]" />
              added
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 bg-[color:var(--remove)]" />
              removed
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 bg-[color:var(--accent)]" />
              modified
            </span>
          </div>

          <div className="flex flex-col gap-16">
            {DIFF_ATLAS.map((pair) => (
              <article
                key={pair.num}
                className="grid grid-cols-1 gap-8 md:grid-cols-12"
              >
                <div className="md:col-span-4 flex flex-col gap-4">
                  <Eyebrow num={pair.num}>{pair.label}</Eyebrow>
                  <h4 className="font-mono text-xl leading-tight tracking-tight text-foreground">
                    {pair.title}
                  </h4>
                  <p className="max-w-[48ch] text-[14px] leading-[1.65] text-[color:var(--ink-muted)]">
                    {pair.description}
                  </p>

                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[12px] text-foreground">
                    <dt className="text-[color:var(--ink-muted)]">grid</dt>
                    <dd>{pair.grid}</dd>
                    <dt className="text-[color:var(--add)]">added</dt>
                    <dd>+{pair.added.toLocaleString()}</dd>
                    <dt className="text-[color:var(--remove)]">removed</dt>
                    <dd>−{pair.removed.toLocaleString()}</dd>
                    <dt className="text-[color:var(--accent)]">modified</dt>
                    <dd>~{pair.modified.toLocaleString()}</dd>
                    <dt className="text-[color:var(--ink-muted)]">drift</dt>
                    <dd>{pair.percent}</dd>
                  </dl>

                  <div className="mt-4 flex flex-col gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                    <span>top hotspots</span>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-foreground">
                      {pair.hotspots.map(([k, v]) => (
                        <span key={k}>
                          {k} · {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { tag: "before", file: pair.before, accent: false },
                    { tag: "after", file: pair.after, accent: false },
                    { tag: "heatmap", file: pair.heatmap, accent: true },
                  ].map((panel) => (
                    <figure key={panel.tag} className="flex flex-col gap-2">
                      <figcaption
                        className={`font-mono text-[10px] uppercase tracking-[0.22em] ${
                          panel.accent
                            ? "text-[color:var(--accent)]"
                            : "text-[color:var(--ink-muted)]"
                        }`}
                      >
                        {panel.tag}
                      </figcaption>
                      <div className="relative aspect-[4/5] w-full overflow-hidden border border-[color:var(--rule)] bg-background">
                        <Image
                          src={panel.file}
                          alt={`${pair.num} ${panel.tag}`}
                          fill
                          sizes="(min-width: 1024px) 240px, 100vw"
                          className="object-contain"
                        />
                      </div>
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ONE-IMAGE DIFF — bake the diff into the render */}
      <section className="w-full border-t border-[color:var(--rule)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 flex flex-col gap-3">
              <Eyebrow num="04">one-image diff</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                One image. Read the whole diff.
              </h3>
            </div>
            <p className="md:col-span-7 max-w-[62ch] self-end text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Instead of asking the agent to compare two renders, bake the diff
              straight into the after-image. Red washes where ink disappeared,
              green where it arrived, amber where the glyph shifted — all over
              the actual braille render. One attachment, one pass, no
              side-by-side bookkeeping.
            </p>
          </div>

          <CommandLine command="agent-ascii diff before.png after.png --annotate --out delta.png" />

          {/* featured: webpage */}
          <figure className="flex flex-col gap-4">
            <figcaption className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em]">
              <span className="text-[color:var(--accent)]">
                {ANNOTATED[0].label}
              </span>
              <span className="text-[color:var(--ink-muted)]">
                +{ANNOTATED[0].added}  −{ANNOTATED[0].removed}  ~
                {ANNOTATED[0].modified}
              </span>
            </figcaption>
            <div
              className={`relative ${ANNOTATED[0].aspect} w-full overflow-hidden border border-[color:var(--rule)] bg-[color:var(--ink)]`}
            >
              <Image
                src={ANNOTATED[0].file}
                alt="annotated webpage diff"
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-contain"
              />
            </div>
          </figure>

          {/* thumbnails for other pairs */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ANNOTATED.slice(1).map((a) => (
              <figure key={a.num} className="flex flex-col gap-2">
                <figcaption className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
                  <span className="text-foreground">{a.title}</span>
                  <span>
                    +{a.added} −{a.removed}
                  </span>
                </figcaption>
                <div
                  className={`relative ${a.aspect} w-full overflow-hidden border border-[color:var(--rule)] bg-[color:var(--ink)]`}
                >
                  <Image
                    src={a.file}
                    alt={`annotated ${a.label}`}
                    fill
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-contain"
                  />
                </div>
              </figure>
            ))}
          </div>

          {/* cost comparison against side-by-side */}
          <div className="flex flex-col gap-3">
            <Rule />
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-x-6 gap-y-3 py-3 font-mono text-[13px]">
              <div className="text-[color:var(--ink-muted)]">delivery</div>
              <div className="text-[color:var(--ink-muted)]">attachments</div>
              <div className="text-[color:var(--ink-muted)]">tokens</div>
              <div className="text-[color:var(--ink-muted)]">
                what the agent has to do
              </div>

              <div className="col-span-4 border-t border-[color:var(--rule)]" />
              <div>side-by-side (atlas)</div>
              <div>3 images</div>
              <div>3 × vision</div>
              <div className="text-[color:var(--ink-muted)]">
                align, compare, locate the drift
              </div>

              <div className="col-span-4 border-t border-[color:var(--rule)]" />
              <div className="text-[color:var(--accent)]">annotated render</div>
              <div>1 image</div>
              <div>1 × vision</div>
              <div className="text-[color:var(--ink-muted)]">
                read the colour overlay
              </div>
            </div>
            <Rule />
          </div>
        </div>
      </section>

      {/* AGENT VIEW — terminal + PR review */}
      <section className="w-full border-t border-[color:var(--rule)] bg-[color:var(--secondary)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 flex flex-col gap-3">
              <Eyebrow num="05">agent view</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                What the agent actually reads.
              </h3>
            </div>
            <p className="md:col-span-7 max-w-[62ch] self-end text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Same diff, three deliveries. In the terminal, unified braille
              diffs read like regular text patches. In a pull request, a
              one-line ninths summary locates the drift for 15 tokens. Raw PNGs
              are the most expensive and the least precise — they need the
              model&apos;s attention budget to tell you anything.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* terminal pane */}
            <div className="flex flex-col overflow-hidden border border-[color:var(--rule)] bg-[color:var(--paper)]">
              <div className="flex items-center justify-between border-b border-[color:var(--rule)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                <span>terminal · zsh</span>
                <span>agent-ascii diff --text</span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12px] leading-[1.55]">
                <code>
                  <span className="text-[color:var(--ink-muted)]">
                    {"$ agent-ascii diff --text before.txt after.txt\n"}
                  </span>
                  {DIFF_SNIPPET.split("\n").map((line, i) => {
                    let cls = "text-foreground";
                    if (line.startsWith("+++") || line.startsWith("---"))
                      cls = "text-[color:var(--ink-muted)]";
                    else if (line.startsWith("@@"))
                      cls = "text-[color:var(--accent)]";
                    else if (line.startsWith("+"))
                      cls = "text-[color:var(--add)]";
                    else if (line.startsWith("-"))
                      cls = "text-[color:var(--remove)]";
                    return (
                      <span key={i} className={`block ${cls}`}>
                        {line || "\u00a0"}
                      </span>
                    );
                  })}
                  <span className="block text-[color:var(--ink-muted)]">
                    {"...  60 lines,  5,891 tokens,  10.0 KB"}
                  </span>
                  <span className="block text-[color:var(--ink-muted)]">
                    {"exit 1  (diff present)"}
                  </span>
                </code>
              </pre>
            </div>

            {/* PR review pane */}
            <div className="flex flex-col overflow-hidden border border-[color:var(--rule)] bg-[color:var(--paper)]">
              <div className="flex items-center justify-between border-b border-[color:var(--rule)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-muted)]">
                <span>pull request · review comment</span>
                <span>#482 · layout drift</span>
              </div>
              <div className="flex flex-col gap-4 px-5 py-4 text-[13px] leading-[1.6] text-foreground">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
                  <span className="inline-block h-6 w-6 border border-[color:var(--rule)] bg-[color:var(--ink)] text-[color:var(--paper)]">
                    <span className="block text-center text-[9px] leading-6">
                      AA
                    </span>
                  </span>
                  <span className="text-foreground">agent-ascii[bot]</span>
                  <span>commented</span>
                  <span>· 2 min ago</span>
                </div>
                <p className="font-mono text-[13px] text-foreground">
                  Hero band drifted{" "}
                  <span className="text-[color:var(--accent)]">48.6%</span> of
                  cells vs baseline at{" "}
                  <code className="text-[color:var(--ink-muted)]">
                    --width 60 --layout
                  </code>
                  .
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  {[
                    { k: "TC", v: 207, accent: true },
                    { k: "TR", v: 38 },
                    { k: "TL", v: 54 },
                    { k: "MC", v: 126 },
                    { k: "MR", v: 51 },
                    { k: "ML", v: 73 },
                    { k: "BC", v: 120 },
                    { k: "BR", v: 71 },
                    { k: "BL", v: 127, accent: true },
                  ].map((c) => (
                    <div
                      key={c.k}
                      className={`border border-[color:var(--rule)] px-2 py-3 text-center ${
                        c.accent
                          ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                          : "text-foreground"
                      }`}
                    >
                      <div className="text-[color:var(--ink-muted)]">{c.k}</div>
                      <div className="text-[13px]">{c.v}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-[color:var(--ink-muted)]">
                  Delivered in{" "}
                  <span className="text-foreground">15 tokens</span> — a
                  sparkline of where the diff lives, not the diff itself.
                  Re-render at width 100 for precision.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)]">
              diff strategy · cost / signal
            </span>
            <Rule />
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] gap-x-6 gap-y-3 font-mono text-[13px]">
              <div className="text-[color:var(--ink-muted)]">strategy</div>
              <div className="text-[color:var(--ink-muted)]">bytes</div>
              <div className="text-[color:var(--ink-muted)]">tokens</div>
              <div className="text-[color:var(--ink-muted)]">format</div>
              <div className="text-[color:var(--ink-muted)]">locates</div>
              {DIFF_STRATEGIES.map((s) => (
                <React.Fragment key={s.name}>
                  <div
                    className={`col-span-5 border-t border-[color:var(--rule)]`}
                  />
                  <div
                    className={
                      s.emphasis
                        ? "text-[color:var(--accent)]"
                        : "text-foreground"
                    }
                  >
                    {s.name}
                  </div>
                  <div>{s.bytes}</div>
                  <div>{s.tokens}</div>
                  <div className="text-[color:var(--ink-muted)]">
                    {s.consumable}
                  </div>
                  <div className="text-[color:var(--ink-muted)]">
                    {s.locates}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THREE-WAY BENCHMARK */}
      <section className="w-full border-t border-[color:var(--rule)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:px-10 md:py-28">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-5 flex flex-col gap-3">
              <Eyebrow num="06">three-way benchmark</Eyebrow>
              <h3 className="font-mono text-3xl font-medium leading-tight tracking-tight text-foreground">
                DOM, ASCII, or both?
              </h3>
            </div>
            <p className="md:col-span-7 max-w-[62ch] self-end text-[15px] leading-[1.65] text-[color:var(--ink-muted)]">
              Three live pages, three strategies, median of three runs. DOM
              wins when the page is structural; ASCII holds a nearly flat cost
              regardless of page complexity; combining them adds semantic
              anchors for about 10% more tokens. Numbers are real —{" "}
              <code className="text-foreground">
                scripts/bench-dom-vs-ascii.py
              </code>
              .
            </p>
          </div>

          <CommandLine command="python3 scripts/bench-dom-vs-ascii.py" />

          <div className="flex flex-col gap-3">
            <Rule />
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-6 gap-y-3 py-3 font-mono text-[13px]">
              <div className="text-[color:var(--ink-muted)]">page</div>
              <div className="text-[color:var(--ink-muted)]">strategy</div>
              <div className="text-[color:var(--ink-muted)]">bytes</div>
              <div className="text-[color:var(--ink-muted)]">tokens</div>
              <div className="text-[color:var(--ink-muted)]">median ms</div>

              {[
                { page: "example.com", rows: [
                  { s: "dom-outline",  b: "219",    t: "55",    ms: "163",   best: "dom" },
                  { s: "ascii",        b: "7,230",  t: "1,534", ms: "204",   best: null },
                  { s: "ascii + dom",  b: "7,301",  t: "1,568", ms: "363",   best: null },
                ]},
                { page: "agent-ascii home", rows: [
                  { s: "dom-outline",  b: "15,666", t: "4,630", ms: "175",   best: "dom" },
                  { s: "ascii",        b: "7,230",  t: "6,066", ms: "265",   best: null },
                  { s: "ascii + dom",  b: "7,656",  t: "6,249", ms: "428",   best: null },
                ]},
                { page: "npm · agent-ascii", rows: [
                  { s: "dom-outline",  b: "29,241", t: "6,948", ms: "179",   best: null },
                  { s: "ascii",        b: "7,230",  t: "5,626", ms: "218",   best: "ascii" },
                  { s: "ascii + dom",  b: "8,898",  t: "6,442", ms: "377",   best: null },
                ]},
              ].map((group) => (
                <React.Fragment key={group.page}>
                  <div className="col-span-5 border-t border-[color:var(--rule)]" />
                  {group.rows.map((r, i) => (
                    <React.Fragment key={group.page + r.s}>
                      <div className={i === 0 ? "text-foreground" : "text-[color:var(--ink-muted)]"}>
                        {i === 0 ? group.page : "\u00a0"}
                      </div>
                      <div
                        className={
                          r.best
                            ? "text-[color:var(--accent)]"
                            : "text-foreground"
                        }
                      >
                        {r.s}
                      </div>
                      <div className="text-[color:var(--ink-muted)]">{r.b}</div>
                      <div
                        className={
                          r.best
                            ? "text-[color:var(--accent)]"
                            : "text-foreground"
                        }
                      >
                        {r.t}
                      </div>
                      <div className="text-[color:var(--ink-muted)]">{r.ms}</div>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <Rule />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                tag: "dom",
                headline: "Cheapest when the page is mostly structure.",
                body:
                  "55 tokens for example.com. Free on every page that isn't doing anything visual — menus, docs, tables, marketplace shells. Skips rendered state.",
              },
              {
                tag: "ascii",
                headline: "Nearly flat cost. Catches visual drift.",
                body:
                  "7,230 bytes regardless of page. Token count depends on glyph density, not DOM size. Only path that detects CSS changes, image swaps, loading states.",
              },
              {
                tag: "ascii + dom",
                headline: "Fingerprint + semantic anchors.",
                body:
                  "One render with label anchors appended ([heading r=4-6 c=10-50] \"Pricing\"). Adds ~10% tokens and ~150ms. Best when the agent has to both see and act.",
                accent: true,
              },
            ].map((p) => (
              <article key={p.tag} className="flex flex-col gap-3 border-t border-[color:var(--rule)] pt-5">
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.22em] ${
                    p.accent
                      ? "text-[color:var(--accent)]"
                      : "text-[color:var(--ink-muted)]"
                  }`}
                >
                  {p.tag}
                </span>
                <h4 className="font-mono text-xl leading-tight tracking-tight text-foreground">
                  {p.headline}
                </h4>
                <p className="max-w-[44ch] text-[14px] leading-[1.65] text-[color:var(--ink-muted)]">
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* COLOPHON */}
      <footer className="w-full border-t border-[color:var(--rule)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink-muted)] md:grid-cols-3 md:px-10">
          <span>agent-ascii · apache-2.0 · 2026</span>
          <span className="md:text-center">
            typeset in jetbrains mono &amp; manrope
          </span>
          <a
            href="https://github.com/Vinniai/agent-ascii"
            className="text-foreground underline decoration-[color:var(--rule)] decoration-1 underline-offset-[6px] hover:decoration-foreground md:text-right"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/Vinniai/agent-ascii ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
