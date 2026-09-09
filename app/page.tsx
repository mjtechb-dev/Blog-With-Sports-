'use client';

import React, { useState, useEffect } from 'react';
import { Article, Category } from '../lib/types';
import { ArticleService } from '../lib/services/article-service';
import { CategoryService } from '../lib/services/category-service';
import { AuthService } from '../lib/services/auth-service';
import { AnalyticsService } from '../lib/services/analytics-service';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CategoryNav } from '../components/CategoryNav';
import { FeaturedArticle } from '../components/FeaturedArticle';
import { ArticleCard } from '../components/ArticleCard';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { ArticleDetailView } from '../components/ArticleDetailView';
import { CategoryPageView } from '../components/CategoryPageView';
import { SearchOverlay } from '../components/SearchOverlay';
import { AdminPanel } from '../components/AdminPanel';
import { ArticleCardSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from '../components/StaticPages';
import { Newspaper, Flame } from 'lucide-react';

export default function HomePage() {
  // Views: 'home' | 'category' | 'article' | 'about' | 'contact' | 'privacy' | 'terms'
  const [activeView, setActiveView] = useState<'home' | 'category' | 'article' | 'about' | 'contact' | 'privacy' | 'terms'>('home');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>(undefined);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Search & Admin Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => AuthService.isAuthenticated());

  // Data initialized from seed data
  const [articles, setArticles] = useState<Article[]>(() => []);
  const [categories, setCategories] = useState<Category[]>(() => []);
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch & Real-Time Firestore Sync
  useEffect(() => {
    // Record visitor count in Firebase Firestore
    AnalyticsService.recordVisit().catch((err) => {
      console.warn('Analytics record warning:', err);
    });

    CategoryService.getAll(true).then((cats) => {
      setCategories(cats);
    });

    // Subscribe to real-time Firestore article updates
    const unsubscribe = ArticleService.subscribeToArticles((updatedList) => {
      const pubOnly = updatedList.filter(a => a.status === 'published');
      setArticles(pubOnly);

      const feat = pubOnly.find(a => a.isFeatured) || pubOnly[0] || null;
      setFeaturedArticle(feat);

      const sortedTrend = [...pubOnly].sort((a, b) => (b.views || 0) - (a.views || 0));
      setTrendingArticles(sortedTrend.slice(0, 4));
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Dynamic SEO & Title Management
  useEffect(() => {
    if (activeView === 'article' && selectedArticle) {
      const seoTitle = selectedArticle.seo?.seoTitle || `${selectedArticle.title} | Blog With Sports`;
      document.title = seoTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', selectedArticle.seo?.metaDescription || selectedArticle.description || '');
      }
    } else if (activeView === 'category' && selectedCategorySlug) {
      document.title = `${selectedCategorySlug.toUpperCase()} News & Analysis | Blog With Sports`;
    } else if (['about', 'contact', 'privacy', 'terms'].includes(activeView)) {
      const titleMap: Record<string, string> = {
        about: 'About Us | Blog With Sports',
        contact: 'Contact Us | Blog With Sports',
        privacy: 'Privacy Policy | Blog With Sports',
        terms: 'Terms of Service | Blog With Sports',
      };
      document.title = titleMap[activeView] || 'Blog With Sports';
    } else {
      document.title = 'Blog With Sports | Global Sports Journalism';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', 'Independent sports journalism covering football, tennis, formula 1, basketball, cricket and global athletics.');
      }
    }
  }, [activeView, selectedArticle, selectedCategorySlug]);

  // Handle URL hash routing on client
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setActiveView('home');
        setSelectedCategorySlug(undefined);
        setSelectedArticle(null);
        return;
      }

      if (hash.startsWith('article/')) {
        const slug = hash.replace('article/', '');
        const art = await ArticleService.getBySlug(slug);
        if (art) {
          setSelectedArticle(art);
          setActiveView('article');
          ArticleService.registerView(art.slug).catch(() => {});
        }
      } else if (hash.startsWith('category/')) {
        const slug = hash.replace('category/', '');
        setSelectedCategorySlug(slug);
        setActiveView('category');
      } else if (hash === 'search') {
        setIsSearchOpen(true);
      } else if (hash === 'admin') {
        setIsAdminOpen(true);
      } else if (['about', 'contact', 'privacy', 'terms'].includes(hash)) {
        setActiveView(hash as any);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation Helpers
  const navigateToHome = () => {
    setActiveView('home');
    setSelectedCategorySlug(undefined);
    setSelectedArticle(null);
    window.history.pushState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setSelectedArticle(null);
    setActiveView('category');
    window.history.pushState(null, '', `#category/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToArticle = (art: Article) => {
    setSelectedArticle(art);
    setActiveView('article');
    window.history.pushState(null, '', `#article/${art.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    ArticleService.registerView(art.slug).then((newViews) => {
      if (newViews > 0) {
        setSelectedArticle(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
      }
    }).catch(() => {});
  };

  const navigateToStatic = (viewName: 'about' | 'contact' | 'privacy' | 'terms') => {
    setActiveView(viewName);
    setSelectedCategorySlug(undefined);
    setSelectedArticle(null);
    window.history.pushState(null, '', `#${viewName}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered articles for Category view
  const categoryArticles = React.useMemo(() => {
    if (!selectedCategorySlug) return [];
    return articles.filter(
      a =>
        a.categoryId.toLowerCase() === selectedCategorySlug.toLowerCase() ||
        a.categoryName.toLowerCase() === selectedCategorySlug.toLowerCase()
    );
  }, [articles, selectedCategorySlug]);

  const currentCategoryObj = React.useMemo(() => {
    if (!selectedCategorySlug) return undefined;
    return categories.find(c => c.slug.toLowerCase() === selectedCategorySlug.toLowerCase());
  }, [categories, selectedCategorySlug]);

  // Non-featured articles for Latest Stories section
  const latestArticles = React.useMemo(() => {
    if (!featuredArticle) return articles;
    return articles.filter(a => a.id !== featuredArticle.id);
  }, [articles, featuredArticle]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-neutral-900 selection:bg-emerald-100 selection:text-emerald-950 font-sans">
      {/* Header */}
      <Header
        categories={categories}
        currentCategory={selectedCategorySlug}
        activeView={activeView}
        onNavigateHome={navigateToHome}
        onSelectCategory={navigateToCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateAbout={() => navigateToStatic('about')}
        onNavigateContact={() => navigateToStatic('contact')}
      />

      {/* Horizontal Category Navigation Bar */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategorySlug}
        onSelectCategory={navigateToCategory}
        onSelectAll={navigateToHome}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <EmptyState
                title="No sports articles published yet"
                description="Our correspondents are preparing new coverage and tactical reports. Published stories will appear here."
              />
            ) : (
              <div className="space-y-10">
                {/* Editorial Hero & Trending Section */}
                {trendingArticles.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Main Editorial Spotlight (70%) */}
                    <div className="lg:col-span-8">
                      {featuredArticle ? (
                        <FeaturedArticle
                          article={featuredArticle}
                          onSelect={navigateToArticle}
                        />
                      ) : (
                        latestArticles[0] && (
                          <FeaturedArticle
                            article={latestArticles[0]}
                            onSelect={navigateToArticle}
                          />
                        )
                      )}
                    </div>

                    {/* Right: Trending Section (30%) */}
                    <div className="lg:col-span-4">
                      <TrendingSidebar
                        articles={trendingArticles}
                        onSelect={navigateToArticle}
                      />
                    </div>
                  </div>
                ) : (
                  (featuredArticle || latestArticles[0]) && (
                    <FeaturedArticle
                      article={featuredArticle || latestArticles[0]}
                      onSelect={navigateToArticle}
                    />
                  )
                )}

                {/* Latest Stories Section */}
                {latestArticles.length > 0 && (
                  <div className="pt-8 border-t border-neutral-200">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                          Latest Stories
                        </h2>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Recent reporting and match debriefs from around the world
                        </p>
                      </div>

                      <span className="text-xs text-neutral-400 font-medium">
                        {latestArticles.length} {latestArticles.length === 1 ? 'Story' : 'Stories'} Available
                      </span>
                    </div>

                    {/* Clean 3-column Article Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {latestArticles.map((article, idx) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          onSelect={navigateToArticle}
                          priority={idx < 3}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CATEGORY PAGE */}
        {activeView === 'category' && currentCategoryObj && (
          <CategoryPageView
            category={currentCategoryObj}
            articles={categoryArticles}
            onSelectArticle={navigateToArticle}
            onBackHome={navigateToHome}
          />
        )}

        {/* VIEW 3: ARTICLE DETAIL PAGE */}
        {activeView === 'article' && selectedArticle && (
          <ArticleDetailView
            article={selectedArticle}
            onBack={navigateToHome}
            onSelectArticle={navigateToArticle}
            onSelectCategory={navigateToCategory}
          />
        )}

        {/* VIEW 4: STATIC PAGES */}
        {activeView === 'about' && <AboutPage onBackHome={navigateToHome} />}
        {activeView === 'contact' && <ContactPage onBackHome={navigateToHome} />}
        {activeView === 'privacy' && <PrivacyPage onBackHome={navigateToHome} />}
        {activeView === 'terms' && <TermsPage onBackHome={navigateToHome} />}
      </main>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={navigateToArticle}
      />

      {/* Admin Panel Overlay */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => {
            setIsAdminOpen(false);
          }}
          onPreviewArticle={art => {
            setIsAdminOpen(false);
            navigateToArticle(art);
          }}
        />
      )}

      {/* Footer */}
      <Footer
        onNavigateHome={navigateToHome}
        onNavigateAbout={() => navigateToStatic('about')}
        onNavigateContact={() => navigateToStatic('contact')}
        onNavigatePrivacy={() => navigateToStatic('privacy')}
        onNavigateTerms={() => navigateToStatic('terms')}
      />
    </div>
  );
}
