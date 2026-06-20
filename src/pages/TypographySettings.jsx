import React, { useState } from 'react';
import { Check, Type, ArrowLeft, Search } from 'lucide-react';
import { useTypography } from '../theme/TypographyContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TypographySettings() {
  const navigate = useNavigate();
  const { 
    selectedHeadingFontId, 
    selectedBodyFontId, 
    applyHeadingTypography, 
    applyBodyTypography, 
    headingFonts, 
    bodyFonts 
  } = useTypography();

  const [activeTab, setActiveTab] = useState('heading'); // 'heading' or 'body'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const headingCategories = ['All', ...new Set(headingFonts.map(f => f.category))];
  const bodyCategories = ['All', ...new Set(bodyFonts.map(f => f.category))];

  const activeFonts = activeTab === 'heading' ? headingFonts : bodyFonts;
  const activeCategories = activeTab === 'heading' ? headingCategories : bodyCategories;
  const currentSelectionId = activeTab === 'heading' ? selectedHeadingFontId : selectedBodyFontId;
  const applyFunction = activeTab === 'heading' ? applyHeadingTypography : applyBodyTypography;
  
  const filteredFonts = activeFonts.filter(font => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          font.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // When switching tabs, reset category if it doesn't exist in the new tab
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSelectedCategory('All');
  };

  return (
    <div className="app-page w-full p-4 md:max-w-xl mx-auto flex flex-col h-[100dvh] bg-[var(--theme-bg)]">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4 flex items-center"
      >
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[var(--theme-surface)] border border-[var(--theme-card-border)] flex items-center justify-center mr-4 text-[var(--theme-text)] hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]" style={{ fontFamily: 'var(--orvix-heading-font-family, inherit)' }}>Typography</h1>
          <p className="text-[var(--theme-text-muted)] text-sm" style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}>Choose your Orvix font style</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex p-1 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-card-border)] mb-4"
      >
        <button
          onClick={() => handleTabSwitch('heading')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'heading' 
              ? 'bg-[var(--theme-primary)] text-white shadow-[var(--theme-glow)]' 
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
          }`}
          style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}
        >
          Heading Fonts
        </button>
        <button
          onClick={() => handleTabSwitch('body')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'body' 
              ? 'bg-[var(--theme-primary)] text-white shadow-[var(--theme-glow)]' 
              : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'
          }`}
          style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}
        >
          Body Fonts
        </button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 space-y-3"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-muted)]" />
          <input
            type="text"
            placeholder={`Search ${activeTab} fonts...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--theme-surface)] border border-[var(--theme-card-border)] rounded-xl py-3 pl-10 pr-4 text-sm text-[var(--theme-text)] focus:outline-none focus:border-[var(--theme-primary)] transition-colors"
            style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}
          />
        </div>

        <div className="flex overflow-x-auto pb-2 space-x-2 scrollbar-hide">
          {activeCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] border-[var(--theme-text)]'
                  : 'bg-transparent text-[var(--theme-text-muted)] border-[var(--theme-card-border)] hover:border-white/20'
              }`}
              style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Font List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-24 pr-1">
        
        {/* Default Option */}
        {selectedCategory === 'All' && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => applyFunction(null)}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
              currentSelectionId === null
                ? 'border-[var(--theme-primary)] shadow-[var(--theme-glow)]'
                : 'border-[var(--theme-card-border)] hover:border-white/20'
            }`}
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-[var(--theme-text)] mb-1" style={{ fontFamily: 'inherit' }}>
                  App Default
                </div>
                <div className="text-sm text-[var(--theme-text-muted)]" style={{ fontFamily: 'inherit' }}>
                  Keep the original Orvix styling
                </div>
                <div className="mt-3 text-[var(--theme-text)] text-base italic" style={{ fontFamily: 'inherit' }}>
                  {activeTab === 'heading' ? "Orvix Private Chat" : "Chat privately with smooth readable messages."}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                currentSelectionId === null
                  ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]'
                  : 'border-[var(--theme-card-border)] bg-transparent'
              }`}>
                {currentSelectionId === null && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
          </motion.div>
        )}

        {filteredFonts.map((font, index) => {
          const isSelected = currentSelectionId === font.id;
          
          return (
            <motion.div
              key={font.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              onClick={() => applyFunction(font.id)}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'border-[var(--theme-primary)] shadow-[var(--theme-glow)]'
                  : 'border-[var(--theme-card-border)] hover:border-white/20'
              }`}
              style={{ background: 'var(--theme-surface)' }}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-primary)] opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              )}
              
              <div className="p-5 flex items-center justify-between relative z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Type className="w-4 h-4 text-[var(--theme-primary)]" />
                    <div 
                      className="text-lg font-bold text-[var(--theme-text)]"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      {font.name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/5 text-[var(--theme-text-muted)]" style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}>
                      {font.category}
                    </span>
                    <div className="text-sm text-[var(--theme-text-muted)] truncate" style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}>
                      {font.description}
                    </div>
                  </div>
                  <div 
                    className="text-[var(--theme-text)] text-[16px] leading-relaxed"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.previewText}
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]'
                    : 'border-[var(--theme-card-border)] bg-transparent'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredFonts.length === 0 && (
          <div className="text-center py-10 text-[var(--theme-text-muted)]" style={{ fontFamily: 'var(--orvix-body-font-family, inherit)' }}>
            No fonts found matching "{searchQuery}"
          </div>
        )}

      </div>
    </div>
  );
}
