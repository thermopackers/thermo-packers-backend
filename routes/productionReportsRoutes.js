import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import ShapeMouldingReport from '../models/ShapeMouldingReport.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET shape moulding report data from DB
router.get('/shape-moulding', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 5, search = '', date } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Build MongoDB query
    const query = {};
    if (search) {
      // Search in product case-insensitive partial match
      query.product = { $regex: search, $options: 'i' };
    }
    if (date) {
      // Filter by exact date ignoring time
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
console.log('Query used for aggregation:', query);

    // Aggregate pipeline to group by date (yyyy-mm-dd)
  const pipeline = [
  { $match: query }, // <-- This must be included to apply search/date filters
  {
    $addFields: {
      dateStr: {
        $dateToString: { format: '%Y-%m-%d', date: '$date' },
      },
    },
  },
  {
    $group: {
      _id: '$dateStr',
      rows: { $push: '$$ROOT' },
    },
  },
  { $sort: { _id: -1 } },
  {
    $facet: {
      paginatedResults: [
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
      ],
      totalCount: [{ $count: 'count' }],
    },
  },
];


    const aggResult = await ShapeMouldingReport.aggregate(pipeline);

    const paginatedResults = aggResult[0]?.paginatedResults || [];
    const totalCount = aggResult[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Convert array of grouped docs to object { date: [...rows] }
    const data = {};
    paginatedResults.forEach((group) => {
      data[group._id] = group.rows.map((doc, idx) => ({
        srNo: idx + 1,
        _id: doc._id,
        date: doc.date.toISOString().split('T')[0],
        product: doc.product,
        operator: doc.operator,
        cycle: doc.cycle,
        pcs: doc.pcs,
        dryWt: doc.dryWt,
        rejects: doc.rejects,
      }));
    });

    res.json({ data, totalPages });
  } catch (err) {
    console.error('Error fetching shape moulding report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST updated shape moulding report data
router.post('/shape-moulding-update', verifyToken, async (req, res) => {
  try {
    const updates = req.body; // Array of shape moulding objects

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Expected an array of data' });
    }

    const bulkOps = updates.map((item) => {
      const filter = item._id ? { _id: item._id } : { _id: new mongoose.Types.ObjectId() };
      return {
        updateOne: {
          filter,
          update: {
            $set: {
              date: new Date(item.date),
              product: item.product,
              operator: item.operator,
              cycle: item.cycle || 0,
              pcs: item.pcs || 0,
              dryWt: item.dryWt || 0,
              rejects: item.rejects || 0,
            },
          },
          upsert: true,
        },
      };
    });

    await ShapeMouldingReport.bulkWrite(bulkOps);

    res.json({ message: 'Shape moulding data updated successfully' });
  } catch (err) {
    console.error('Error updating shape moulding report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
