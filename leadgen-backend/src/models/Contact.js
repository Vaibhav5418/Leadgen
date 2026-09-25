const mongoose = require('mongoose');
const commonContactFields = require('./commonContactFields');

const contactSchema = new mongoose.Schema({
  ...commonContactFields
}, {
  timestamps: true
});

// Indexes for faster searches
contactSchema.index({ name: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ category: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ company: 1, category: 1 }); // Compound index for common queries
contactSchema.index({ category: 1, company: 1 }); // Reverse compound index
contactSchema.index({ city: 1 });
contactSchema.index({ state: 1 });
contactSchema.index({ country: 1 });
contactSchema.index({ createdAt: 1 }); // For dashboard date range queries
contactSchema.index({ industry: 1 }); // For industry aggregations
contactSchema.index({ industry: 1, createdAt: 1 }); // Compound index for industry growth queries
contactSchema.index({ updatedAt: 1 }); // For recent activity queries
contactSchema.index({ personLinkedinUrl: 1 }); // For LinkedIn enrichment queries
contactSchema.index({ companyLinkedinUrl: 1 }); // For LinkedIn enrichment queries
contactSchema.index({ lastLinkedInFetch: 1 }); // For stale enrichment queries
contactSchema.index({ title: 1 }); // For title-based queries
contactSchema.index({ firstPhone: 1 }); // For phone validation queries
contactSchema.index({ email: 1, title: 1, company: 1 }); // Compound index for outreach ready queries
contactSchema.index({ state: 1, country: 1 }); // Compound index for geographic queries
contactSchema.index({ industry: 1, title: 1 }); // Compound index for ICP matching
contactSchema.index({ keywords: 1 }); // Index for keyword searches
// Additional compound indexes for common query patterns
contactSchema.index({ category: 1, createdAt: -1 }); // For category filtering with sorting
contactSchema.index({ company: 1, createdAt: -1 }); // For company filtering with sorting
contactSchema.index({ email: 1, createdAt: -1 }); // For email queries with sorting
contactSchema.index({ name: 1, email: 1 }); // Compound index for duplicate checking
contactSchema.index({ createdBy: 1 }); // Index for user-based filtering

module.exports = mongoose.model('Contact', contactSchema);
