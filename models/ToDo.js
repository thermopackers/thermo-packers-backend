import mongoose from 'mongoose';

const toDoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['NOT DONE', 'DONE'],
      default: 'NOT DONE',
    },
    isDeletedByEmployee: {
  type: Boolean,
  default: false,
},

    notes: String,
    files: [String], // optional file URLs or file names
    dueDate: Date,
    doneRemarks: { type: String, default: '' },
doneOn: { type: Date },
assignedOn: { type: Date, default: Date.now },

  },
  { timestamps: true }
);

export default mongoose.model('ToDo', toDoSchema);
