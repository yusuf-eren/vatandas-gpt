import mongoose, { Schema, Document } from 'mongoose';

// Interface for individual messages in the conversation
export interface IConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    type: 'input_text' | 'output_text';
    text: string;
    providerData?: Record<string, unknown>;
  }>;
  status?: 'in_progress' | 'completed' | 'incomplete';
  timestamp: Date;
}

// Interface for the conversation document
export interface IConversation extends Document {
  chatId: string;
  userId?: string;
  title?: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
}

// Schema for individual messages
const ConversationMessageSchema = new Schema<IConversationMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: [
    {
      type: {
        type: String,
        enum: ['input_text', 'output_text'],
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      providerData: {
        type: Schema.Types.Mixed,
        required: false,
      },
    },
  ],
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'incomplete'],
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Schema for the conversation document
const ConversationSchema = new Schema<IConversation>(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      // Removed index: true to avoid duplicate with schema.index()
    },
    userId: {
      type: String,
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
      maxlength: 100,
    },
    messages: [ConversationMessageSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient queries
ConversationSchema.index({ userId: 1 }); // For user-based conversation queries
ConversationSchema.index({ lastActivity: -1 });

// Update lastActivity on save
ConversationSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

export const ConversationModel = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
