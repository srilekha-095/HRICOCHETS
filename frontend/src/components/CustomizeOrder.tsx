import React, { useState } from "react";
import { ArrowLeft, Upload, X,AlertCircle } from "lucide-react";
import logo from "../assets/Mascot.svg";
import { useCart, type CartItem } from "../contexts/CartContext";

interface CustomizeOrderProps {
  onBack: () => void;
}

// Extend CartItem to include custom order fields
interface CustomCartItem extends CartItem {
  customDetails?: {
    productType: string;
    description: string;
    uploadedFilesCount: number;
  };
}

export function CustomizeOrder({ onBack }: CustomizeOrderProps) {
  const { addToCart } = useCart();

  const [formData, setFormData] = useState({
    productType: "",
    description: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Custom popup for missing images
  const [showPopup, setShowPopup] = useState(false);

  // Handle uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...uploadedFiles, ...files].slice(0, 5);
    const newUrls = files.map((file) => URL.createObjectURL(file));

    setUploadedFiles(newFiles);
    setPreviewUrls((prev) => [...prev, ...newUrls].slice(0, 5));
  };

  // DELETE a picture
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]); // Clean memory

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // FORM SUBMIT
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom popup instead of browser alert
    if (uploadedFiles.length === 0) {
      setShowPopup(true);
      return;
    }

    // Create custom cart item
    const customItem: CustomCartItem = {
      id: Date.now(),
      name: `Custom: ${formData.productType}`,
      image: previewUrls[0], // Thumbnail
      price: 0,
      quantity: 1,
      color: "Custom",
      size: "N/A",
      customDetails: {
        productType: formData.productType,
        description: formData.description,
        uploadedFilesCount: uploadedFiles.length,
      },
    };

    addToCart(customItem);
    setSubmitted(true);
  };

  // SUCCESS screen
  if (submitted) {
    return (
      <div className="min-h-screen pt-16 bg-gradient-to-b from-white to-gray-50 dark:from-[#053641] dark:to-[#042830] flex items-center justify-center py-12 px-4">
        <div className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <img src={logo} alt="Hricochets Logo" className="h-18 w-auto" />
          </div>
          <h2 className="text-2xl text-[#053641] dark:text-white mb-4">
            Request Added to Cart!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your custom order request has been added to your cart. Proceed to checkout when you're ready.
          </p>

          <div className="bg-[#C6E7FF]/20 dark:bg-[#053641]/40 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-[#053641] dark:text-white">What's next?</strong>
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>Go to your cart to review the request</li>
              <li>Complete checkout to submit your order</li>
              <li>We'll contact you within 24–48 hours</li>
              <li>We'll discuss pricing & timeline</li>
              <li>Once approved, we start creating!</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3 w-full">
            <button
              onClick={onBack}
              className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-3 rounded-full hover:bg-[#042830] dark:hover:bg-gray-100 transition-all"
            >
              Back to Home
            </button>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ productType: "", description: "" });
                setUploadedFiles([]);
                setPreviewUrls([]);
              }}
              className="w-full border-2 border-[#053641] dark:border-white text-[#053641] dark:text-white py-3 rounded-full hover:bg-[#053641]/5 dark:hover:bg-white/5 transition-all"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN FORM
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-white to-gray-50 dark:from-[#053641] dark:to-[#042830] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="w-full flex items-center bg-white/95 dark:bg-[#053641] px-4 py-4 rounded-xl mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#053641] dark:text-white hover:opacity-80 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition" />
            <span className="text-lg font-semibold">Back to Home</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center space-y-4 px-4">
          <h1 className="text-4xl sm:text-5xl text-[#053641] dark:text-white">Customize Your Order</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            Share your vision and upload reference images. We'll bring your ideas to life!
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#042830] rounded-3xl shadow-2xl p-8 sm:p-12 space-y-8 border border-gray-100 dark:border-gray-700 mt-10"
        >
          {/* Product Type */}
          <div className="space-y-3">
            <label className="block text-lg text-[#053641] dark:text-white font-medium">
              What would you like us to make? <span className="text-[#FF92C4]">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              placeholder="E.g., Custom tote bag, unique t-shirt design..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-lg text-[#053641] dark:text-white font-medium">
              Describe your idea <span className="text-[#FF92C4]">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about colors, patterns, sizes, materials, style preferences... The more details, the better!"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#053641] text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#053641] dark:focus:ring-white"
            />
          </div>

          {/* Upload */}
          <div className="space-y-3">
            <label className="block text-lg text-[#053641] dark:text-white font-medium">
              Upload Reference Images <span className="text-[#FF92C4]">*</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload up to 5 images to help us understand your vision better
            </p>

            <div>
              <input
                id="fileUpload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadedFiles.length >= 5}
              />
              <label
                htmlFor="fileUpload"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer transition ${
                  uploadedFiles.length >= 5
                    ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
                    : "hover:bg-[#C6E7FF]/20 dark:hover:bg-[#053641]/40 hover:border-[#053641] dark:hover:border-white"
                }`}
              >
                <Upload className="h-10 w-10 text-[#053641] dark:text-white mb-2" />
                <span className="text-[#053641] dark:text-white font-medium">
                  {uploadedFiles.length >= 5 ? "Maximum 5 images reached" : "Click to upload images"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {uploadedFiles.length}/5 uploaded
                </span>
              </label>
            </div>

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#053641] dark:bg-white text-white dark:text-[#053641] py-4 rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all font-medium text-lg"
          >
            Add Custom Request to Cart
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
          <p>💡 Our team will contact you within 24–48 hours after you complete checkout</p>
        </div>
      </div>

      {/* CUSTOM POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white dark:bg-[#053641] p-6 rounded-2xl w-80 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-gray-800 dark:text-white text-lg font-medium mb-4">
              Please upload at least one reference image to help us understand your vision.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="bg-[#053641] dark:bg-white text-white dark:text-[#053641] px-6 py-2 rounded-xl hover:opacity-80 transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}