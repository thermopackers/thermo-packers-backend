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
    repeat: {
  type: String,
  enum: ['ONE_TIME', 'MONTHLY', 'YEARLY'],
  default: 'ONE_TIME',
},
    isDeletedByEmployee: {
  type: Boolean,
  default: false,
},

    notes: String,
    images: [String],
   files: [{ type: String }],        // images assigned with task
doneFiles: [{ type: String }],    // images uploaded by employee
    dueDate: Date,
    doneRemarks: { type: String, default: '' },
doneOn: { type: Date },
assignedOn: { type: Date, default: Date.now },

  },
  { timestamps: true }
);

export default mongoose.model('ToDo', toDoSchema);
