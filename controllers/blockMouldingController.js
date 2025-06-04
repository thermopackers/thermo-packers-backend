import BlockMouldingReport from '../models/BlockMouldingReport.js';

// GET all reports
export const getBlockMouldingReports = async (req, res) => {
  const { role, productionSection } = req.user;
  if (!(role === 'accounts' || productionSection === 'blockMoulding')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { page = 1, limit = 10, search = '', date = '' } = req.query;

  const query = {};
  if (search) query.mouldName = { $regex: search, $options: 'i' };
  if (date) query.date = date;

  try {
    const allRecords = await BlockMouldingReport.find(query).sort({ date: -1 });
    
    // Group by date
    const groupedByDate = allRecords.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push(curr);
      return acc;
    }, {});

    const dateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
    const totalPages = Math.ceil(dateKeys.length / limit);
    const paginatedDates = dateKeys.slice((page - 1) * limit, page * limit);

    const paginatedGrouped = {};
    paginatedDates.forEach(date => {
      paginatedGrouped[date] = groupedByDate[date];
    });

    res.json({
      data: paginatedGrouped,
      totalPages,
      currentPage: Number(page)
    });
  } catch (err) {
    console.error('Error fetching block moulding report:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// POST (bulk update/save)
export const updateBlockMouldingReports = async (req, res) => {
  try {
    await BlockMouldingReport.deleteMany({});
    await BlockMouldingReport.insertMany(req.body);
    res.status(200).json({ message: 'Block moulding report saved successfully' });
  } catch (err) {
    console.error('Error updating block moulding reports:', err);
    res.status(500).json({ message: 'Failed to save report' });
  }
};
