import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ExternalLinkIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md text-center p-6 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl animate-fade-in">
        <div className="text-red-500 dark:text-yellow-400 mb-4 text-6xl mx-auto">
          <ExternalLinkIcon />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-800 dark:text-white mb-4">
          404
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Oops! The page you’re looking for doesn’t exist.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition duration-300"
        >
          Go to Homepage
        </a>
      </div>
    </div>
  );
};

export default NotFound;