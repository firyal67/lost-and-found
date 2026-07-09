const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    post:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post',  required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    status: {
      type: String,
      enum: { values: ['pending', 'approved', 'rejected'], message: 'Invalid status' },
      default: 'pending',
    },
    message:       { type: String, trim: true, maxlength: [500, 'Message too long'], default: '' },
    revealedEmail: { type: String, default: null }, // révélé si approved
    revealedPhone: { type: String, default: null },
  },
  { timestamps: true }
);

// Un seul contact par (post, requester)
contactSchema.index({ post: 1, requester: 1 }, { unique: true });
contactSchema.index({ owner: 1, status: 1 });

contactSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Contact', contactSchema);
