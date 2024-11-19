import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { supabase, CarpSpecies, CarpAge, UPLOAD_CONFIG, Auction } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const SPECIES_OPTIONS: CarpSpecies[] = ['common', 'mirror', 'koi', 'leather'];
const AGE_OPTIONS: CarpAge[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];

export default function AuctionItemForm() {
  const { id: auctionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_price: '',
    min_sell_price: '',
    weight: '',
    length: '',
    bloodline: '',
    species: 'common' as CarpSpecies,
    age: 'C1' as CarpAge,
    gender: 'male' as 'male' | 'female',
  });
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    fetchAuction();
  }, [auctionId]);

  const fetchAuction = async () => {
    if (!auctionId) return;
    
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (error) {
      console.error('Error fetching auction:', error);
      toast.error('Failed to load auction details');
      navigate('/dashboard');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: UPLOAD_CONFIG.maxFiles,
    maxSize: UPLOAD_CONFIG.maxFileSize,
    onDrop: (acceptedFiles) => {
      setImages([...images, ...acceptedFiles].slice(0, UPLOAD_CONFIG.maxFiles));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auctionId) return;

    setLoading(true);
    try {
      // Upload images
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const fileName = `${crypto.randomUUID()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('auction-images')
            .upload(fileName, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('auction-images')
            .getPublicUrl(data.path);

          return publicUrl;
        })
      );

      // Create auction item
      const { error } = await supabase.from('auction_items').insert({
        ...formData,
        auction_id: auctionId,
        seller_id: user.id,
        start_price: parseFloat(formData.start_price),
        min_sell_price: parseFloat(formData.min_sell_price),
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length),
        images: imageUrls,
      });

      if (error) throw error;

      toast.success('Item added to auction successfully!');
      navigate(`/auction/${auctionId}`);
    } catch (error) {
      console.error('Error creating auction item:', error);
      toast.error('Failed to create auction item');
    } finally {
      setLoading(false);
    }
  };

  if (!auction) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Add Item to Auction: {auction.title}</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="input w-full"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="input w-full"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_price" className="block text-sm font-medium text-gray-300">Start Price (€)</label>
              <input
                type="number"
                id="start_price"
                name="start_price"
                required
                min="0"
                step="0.01"
                className="input w-full"
                value={formData.start_price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="min_sell_price" className="block text-sm font-medium text-gray-300">Minimum Sell Price (€)</label>
              <input
                type="number"
                id="min_sell_price"
                name="min_sell_price"
                required
                min={formData.start_price}
                step="0.01"
                className="input w-full"
                value={formData.min_sell_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-300">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                required
                min="0"
                step="0.01"
                className="input w-full"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="length" className="block text-sm font-medium text-gray-300">Length (cm)</label>
              <input
                type="number"
                id="length"
                name="length"
                required
                min="0"
                step="0.1"
                className="input w-full"
                value={formData.length}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-300">Species</label>
              <select
                id="species"
                name="species"
                required
                className="input w-full"
                value={formData.species}
                onChange={handleChange}
              >
                {SPECIES_OPTIONS.map((species) => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-300">Age</label>
              <select
                id="age"
                name="age"
                required
                className="input w-full"
                value={formData.age}
                onChange={handleChange}
              >
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bloodline" className="block text-sm font-medium text-gray-300">Bloodline</label>
              <input
                type="text"
                id="bloodline"
                name="bloodline"
                className="input w-full"
                value={formData.bloodline}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300">Gender</label>
              <select
                id="gender"
                name="gender"
                required
                className="input w-full"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
            <div
              {...getRootProps()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer"
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-400">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max {UPLOAD_CONFIG.maxFiles} images, up to {UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB each
              </p>
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Adding Item...' : 'Add Item to Auction'}
          </button>
        </div>
      </div>
    </form>
  );
}