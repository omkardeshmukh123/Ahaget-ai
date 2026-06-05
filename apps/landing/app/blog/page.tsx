'use client';

import { InnerNav, InnerFooter } from '../../components/inner-layout';

const posts = [
  {
    slug: '#',
    category: 'Product',
    categoryColor: 'bg-[#8A2BE2]/15 text-[#B06CF5]',
    title: 'Why your onboarding is bleeding users (and how to fix it in one afternoon)',
    excerpt: 'Studies show 40-60% of SaaS users who sign up never return after their first session. The fix isn\'t more drip emails — it\'s contextual, AI-driven guidance at the exact moment users get stuck.',
    date: 'June 3, 2026',
    readTime: '6 min read',
    featured: true,
    emoji: '🚪',
  },
  {
    slug: '#',
    category: 'AI',
    categoryColor: 'bg-purple-500/15 text-purple-400',
    title: 'Churn scoring 101: How Ahaget\'s ML model catches at-risk users before they leave',
    excerpt: 'A look under the hood of our churn prediction model — what signals we track, how we score users in real time, and why session depth matters more than login frequency.',
    date: 'May 28, 2026',
    readTime: '8 min read',
    featured: false,
    emoji: '🔮',
  },
  {
    slug: '#',
    category: 'Engineering',
    categoryColor: 'bg-emerald-500/15 text-emerald-400',
    title: 'How we built a sub-100ms AI widget without blocking page load',
    excerpt: 'The Ahaget widget loads in under 62ms on a 3G connection. Here\'s the architecture: async loading, edge caching, and how we defer AI calls to never impact your Core Web Vitals.',
    date: 'May 20, 2026',
    readTime: '10 min read',
    featured: false,
    emoji: '⚡',
  },
  {
    slug: '#',
    category: 'Growth',
    categoryColor: 'bg-pink-500/15 text-pink-400',
    title: 'The SaaS user lifecycle: a framework for thinking about every stage from signup to expansion',
    excerpt: 'Acquisition is just the beginning. This framework maps every stage of the user lifecycle and identifies which AI interventions drive the most impact at each step.',
    date: 'May 12, 2026',
    readTime: '12 min read',
    featured: false,
    emoji: '📈',
  },
  {
    slug: '#',
    category: 'Case Study',
    categoryColor: 'bg-orange-500/15 text-orange-400',
    title: 'How a B2B SaaS reduced churn by 31% in 60 days with Ahaget',
    excerpt: 'A project management tool was losing 12% of new users in the first week. After deploying Ahaget\'s smart onboarding flows and churn alerts, they turned that number around completely.',
    date: 'May 5, 2026',
    readTime: '7 min read',
    featured: false,
    emoji: '📊',
  },
  {
    slug: '#',
    category: 'Product',
    categoryColor: 'bg-blue-500/15 text-blue-400',
    title: 'Introducing A/B testing for onboarding flows',
    excerpt: 'Stop guessing which onboarding sequence converts better. Ahaget v1.1.0 ships built-in A/B testing with automatic winner promotion when results hit statistical significance.',
    date: 'June 1, 2026',
    readTime: '4 min read',
    featured: false,
    emoji: '🧪',
  },
];

export default function BlogPage() {
  const featuredPost = posts.find((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background">
      <InnerNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="orb w-[400px] h-[400px] bg-[#8A2BE2]/10 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">✍️ Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Insights on AI, SaaS &amp; user lifecycle
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Deep dives, case studies, and product updates from the Ahaget team.
          </p>
        </div>
      </section>

      {/* Featured post */}
      {featuredPost && (
        <section className="pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href={featuredPost.slug} className="group block glass glass-hover rounded-2xl p-8 md:p-10 border border-white/[0.06] hover:border-[#8A2BE2]/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 glass rounded-2xl flex items-center justify-center text-5xl border border-[#8A2BE2]/20">
                  {featuredPost.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${featuredPost.categoryColor}`}>{featuredPost.category}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8A2BE2]/15 text-[#B06CF5] border border-[#8A2BE2]/20">Featured</span>
                    <span className="text-white/30 text-xs">{featuredPost.date}</span>
                    <span className="text-white/30 text-xs">·</span>
                    <span className="text-white/30 text-xs">{featuredPost.readTime}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight group-hover:text-[#B06CF5] transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-white/50 leading-relaxed mb-4">{featuredPost.excerpt}</p>
                  <span className="text-[#B06CF5] text-sm font-medium group-hover:underline">Read article →</span>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <a
                key={post.title}
                href={post.slug}
                className="group glass glass-hover rounded-2xl p-6 border border-white/[0.06] hover:border-[#8A2BE2]/30 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${post.categoryColor}`}>{post.category}</span>
                  <span className="text-3xl">{post.emoji}</span>
                </div>
                <h2 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-[#B06CF5] transition-colors flex-1">
                  {post.title}
                </h2>
                <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-white/30 text-xs mt-auto">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-10 border border-[#8A2BE2]/20 bg-[#8A2BE2]/5 text-center">
            <div className="text-3xl mb-4">📬</div>
            <h3 className="text-white font-black text-2xl mb-3">Get new posts in your inbox</h3>
            <p className="text-white/50 mb-6">Deep dives on AI, SaaS growth, and product — once or twice a month.</p>
            <a
              href="mailto:hello@ahaget.ai?subject=Subscribe to Ahaget Blog"
              className="inline-flex items-center gap-2 shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-glow hover:scale-[1.02] text-sm"
            >
              Subscribe via email →
            </a>
          </div>
        </div>
      </section>

      <InnerFooter />
    </div>
  );
}
