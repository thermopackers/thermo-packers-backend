import Asset from '../models/Asset.js';

// Get all assets
export const getAssets = async (req, res) => {
  try {
    const userId = req.user.id; // or req.user._id depending on your JWT payload
    let assets;

    if (req.user.role === 'admin') {
      assets = await Asset.find().populate('issuedTo', 'username role name');
    } else {
      assets = await Asset.find({ issuedTo: userId }).populate('issuedTo', 'username email role name');
    }

    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get assets', error });
  }
};



// Get single asset by ID
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('issuedTo', 'username');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get asset', error });
  }
};

// Create new asset
export const createAsset = async (req, res) => {
  try {
    const newAsset = new Asset(req.body);
    const savedAsset = await newAsset.save();
    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create asset', error });
  }
};

// Update asset by ID
export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Update top-level fields
    if (req.body.mobileNumber) asset.mobileNumber = req.body.mobileNumber;
    if (req.body.issuedTo) asset.issuedTo = req.body.issuedTo;

    // Parse the assets JSON string from the form
    if (req.body.assets) {
      const updatedAssets = JSON.parse(req.body.assets);

      // req.files contains new uploaded images from CloudinaryStorage
      // Group files by the index prefix in the filename, e.g. '0_filename.jpg'
      const filesByAssetIndex = {};
      (req.files || []).forEach((file) => {
        // file.filename is the Cloudinary public_id but originalname has your naming scheme
        const originalName = file.originalname; // e.g. '0_someimage.jpg'
        const idx = originalName.split('_')[0];
        if (!filesByAssetIndex[idx]) filesByAssetIndex[idx] = [];
        filesByAssetIndex[idx].push(file.path || file.secure_url); // cloudinary url
      });

      // Merge uploaded images into each asset's images array
      updatedAssets.forEach((assetItem, idx) => {
        const newImages = filesByAssetIndex[idx] || [];
        // Merge new images with existing images (assume assetItem.images is existing URLs array)
        assetItem.images = [...(assetItem.images || []), ...newImages];
      });

      // Now replace the asset.assets array with the updated one including new images
      asset.assets = updatedAssets;
    }

    const updatedAsset = await asset.save();
    res.json(updatedAsset);
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(400).json({ message: 'Failed to update asset', error });
  }
};





// Delete asset by ID
export const deleteAsset = async (req, res) => {
  try {
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    if (!deletedAsset) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete asset', error });
  }
};


// controllers/assetController.js
export const issueAssets = async (req, res) => {
  try {
    const { mobileNumber, issuedTo, assets } = req.body;

    const parsedAssets = JSON.parse(assets); // if sent as JSON string
    const files = req.files;

    // Match images to assets
    const enrichedAssets = parsedAssets.map((asset, index) => {
      const relatedImages = files
        .filter(file => file.originalname.startsWith(`${index}_`))
        .map(file => file.path); // cloudinary URL
      return { ...asset, images: relatedImages };
    });

    const existingAsset = await Asset.findOne({ issuedTo });
    if (existingAsset) {
      return res.status(400).json({ success: false, message: 'Assets already issued to this user.' });
    }

    const newAssetRecord = new Asset({
      mobileNumber,
      issuedTo,
      assets: enrichedAssets,
    });

    await newAssetRecord.save();

    return res.status(201).json({ message: 'Assets issued successfully', asset: newAssetRecord });
  } catch (error) {
    console.error('Error issuing assets:', error);
    return res.status(500).json({ message: 'Server error issuing assets' });
  }
};





export const getAllIssuedAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('issuedTo', 'name email role');
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error.stack || error);
    res.status(500).json({ message: 'Server error fetching assets' });
  }
};

