'use strict';
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Conversation liée (Contact approuvé)
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    // Expéditeur
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Contenu texte
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message too long (max 2000 chars)'],
    },
    // Lu par le destinataire ?
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Index composé : récupérer les messages d'une conversation triés par date
messageSchema.index({ contact: 1, createdAt: 1 });

messageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Message', messageSchema);
