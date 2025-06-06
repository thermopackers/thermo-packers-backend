import cron from 'node-cron';
import ToDo from './models/ToDo.js';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  const today = new Date();

  const completedTasks = await ToDo.find({
    status: 'DONE',
    repeat: { $in: ['MONTHLY', 'YEARLY'] },
  });

  for (let task of completedTasks) {
    // Check if task is eligible to be repeated
    let nextDueDate = null;
    if (task.repeat === 'MONTHLY') {
      nextDueDate = new Date(task.doneOn);
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else if (task.repeat === 'YEARLY') {
      nextDueDate = new Date(task.doneOn);
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
    }

    if (nextDueDate <= today) {
      await ToDo.create({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        assignedBy: task.assignedBy,
        dueDate: nextDueDate,
        assignedOn: new Date(),
        status: 'NOT DONE',
        repeat: task.repeat,
      });
    }
  }
    console.log('Recurring tasks processed.');

});
