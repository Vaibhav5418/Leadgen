const mongoose = require('mongoose');
const commonContactFields = require('./commonContactFields');

const prospectContactSchema = new mongoose.Schema({
  ...commonContactFields
}, {
  timestamps: true
});

// Indexes for faster searches
prospectContactSchema.index({ name: 1 });
prospectContactSchema.index({ email: 1 });
prospectContactSchema.index({ category: 1 });
prospectContactSchema.index({ company: 1 });
prospectContactSchema.index({ company: 1, category: 1 }); // Compound index for common queries
prospectContactSchema.index({ category: 1, company: 1 }); // Reverse compound index
prospectContactSchema.index({ city: 1 });
prospectContactSchema.index({ state: 1 });
prospectContactSchema.index({ country: 1 });
prospectContactSchema.index({ createdAt: 1 }); // For dashboard date range queries
prospectContactSchema.index({ industry: 1 }); // For industry aggregations
prospectContactSchema.index({ industry: 1, createdAt: 1 }); // Compound index for industry growth queries
prospectContactSchema.index({ updatedAt: 1 }); // For recent activity queries
prospectContactSchema.index({ personLinkedinUrl: 1 }); // For LinkedIn enrichment queries
prospectContactSchema.index({ companyLinkedinUrl: 1 }); // For LinkedIn enrichment queries
prospectContactSchema.index({ lastLinkedInFetch: 1 }); // For stale enrichment queries
prospectContactSchema.index({ title: 1 }); // For title-based queries
prospectContactSchema.index({ firstPhone: 1 }); // For phone validation queries
prospectContactSchema.index({ email: 1, title: 1, company: 1 }); // Compound index for outreach ready queries
prospectContactSchema.index({ state: 1, country: 1 }); // Compound index for geographic queries
prospectContactSchema.index({ industry: 1, title: 1 }); // Compound index for ICP matching
prospectContactSchema.index({ keywords: 1 }); // Index for keyword searches

module.exports = mongoose.model('ProspectContact', prospectContactSchema);
