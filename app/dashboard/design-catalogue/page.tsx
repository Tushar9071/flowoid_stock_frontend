'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/status-badge';
import { mockDesigns } from '@/lib/data';
import { designCategories, formatCurrency } from '@/lib/constants';
import { Search, Plus, Grid2X2, List } from 'lucide-react';

export default function DesignCataloguePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDesigns = mockDesigns.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         design.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || design.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout title="Design Catalogue">
      <div className="space-y-6">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search designs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Design
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Categories
          </button>
          {designCategories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Designs Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesigns.map(design => (
              <Card key={design.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-primary/10 to-teal/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-serif text-primary mb-2">✦</div>
                    <p className="text-sm text-muted-foreground">{design.category}</p>
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Code</p>
                      <p className="font-semibold text-text">{design.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium text-text">{design.name}</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Piece Rate</p>
                        <p className="font-semibold text-primary">{formatCurrency(design.pieceRate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dozen Rate</p>
                        <p className="font-semibold text-primary">{formatCurrency(design.salePricePerDozen)}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <StatusBadge status={design.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-3">
            {filteredDesigns.map(design => (
              <Card key={design.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl text-primary">✦</div>
                        <div>
                          <p className="font-semibold text-text">{design.code} - {design.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{design.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Piece Rate</p>
                        <p className="font-semibold text-primary">{formatCurrency(design.pieceRate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Dozen Rate</p>
                        <p className="font-semibold text-primary">{formatCurrency(design.salePricePerDozen)}</p>
                      </div>
                      <StatusBadge status={design.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredDesigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No designs found</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          Showing {filteredDesigns.length} of {mockDesigns.length} designs
        </div>
      </div>
    </DashboardLayout>
  );
}
