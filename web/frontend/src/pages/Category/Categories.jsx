/**
 * FILE: web/frontend/src/pages/Category/Categories.jsx
 * MỤC ĐÍCH: Trang danh sách tất cả categories
 */

import { Link } from "react-router-dom";
import { useQuery } from "react-query";
import { categoriesAPI } from "../../services/api";
import Loading from "../../components/UI/Loading";
import { FiFolder, FiFileText } from "react-icons/fi";
import { formatNumber } from "../../utils/helpers";

const Categories = () => {
  const { data, isLoading, error } = useQuery("categories", () =>
    categoriesAPI.getCategories()
  );

  if (isLoading) return <Loading />;
  if (error)
    return <div className="alert alert-error">Lỗi khi tải danh mục</div>;

  // data đã được unwrap 2 lần, trực tiếp là array
  const categories = data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Danh mục</h1>
        <div className="text-sm text-base-content/60">
          {categories.length} danh mục
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/c/${category.slug}`}
            className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-start gap-3">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-lg w-12">
                    <FiFolder className="text-2xl" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="card-title text-lg">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-base-content/60 line-clamp-2 mt-1">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <FiFileText />
                      <span>
                        {formatNumber(category.stats?.postsCount || 0)} bài viết
                      </span>
                    </div>
                    <div>
                      {formatNumber(category.stats?.followersCount || 0)}{" "}
                      followers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-base-content/60">
          Chưa có danh mục nào
        </div>
      )}
    </div>
  );
};

export default Categories;
