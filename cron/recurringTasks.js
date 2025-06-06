import cron from 'node-cron';
import ToDo from '../models/ToDo.js';

// Runs every minute (change to '0 0 * * *' for midnight in production)
export const startRecurringTasksJob = () => {
  cron.schedule('0 0 * * *', async () => {
    const runTime = new Date().toISOString();
    console.log(`\n🕒 [${runTime}] Running recurring tasks cron job...`);

    try {
      const today = new Date();
      console.log(`📅 Today is ${today.toISOString()}`);

      // Fetch tasks with repeat = MONTHLY or YEARLY and status DONE
      const completedTasks = await ToDo.find({
        status: 'DONE',
        repeat: { $in: ['MONTHLY', 'YEARLY'] },
      });

      console.log(`🔍 Found ${completedTasks.length} completed repeating task(s).`);

      for (const task of completedTasks) {
        console.log(`\n➡️ Checking task: ${task._id} | Title: "${task.title}" | Repeat: ${task.repeat}`);

        if (!task.doneOn) {
          console.log(`⚠️ Skipping task ${task._id}: missing doneOn date.`);
          continue;
        }

        // Calculate next due date
        let nextDueDate = new Date(task.doneOn);
        if (task.repeat === 'MONTHLY') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        } else if (task.repeat === 'YEARLY') {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        console.log(`📆 Task ${task._id} next due date: ${nextDueDate.toISOString()}`);

        if (nextDueDate <= today) {
          console.log(`✅ Due date reached! Creating new repeated task for: ${task._id}`);

          const newTask = new ToDo({
            title: task.title,
            description: task.description,
            assignedBy: task.assignedBy,
            assignedTo: task.assignedTo,
            dueDate: nextDueDate,
            assignedOn: new Date(),
            status: 'NOT DONE',
            repeat: task.repeat,
            notes: task.notes || '',
            files: task.files || [],
          });

          await newTask.save();
          console.log(`🆕 New repeated task created with ID: ${newTask._id}`);
        } else {
          console.log(`⏳ Task ${task._id} not due yet. Next due: ${nextDueDate.toISOString()}`);
        }
      }

      console.log(`✅ Cron job finished at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('❌ Error during recurring task job execution:', error);
    }
  });
};
