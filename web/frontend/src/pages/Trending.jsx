/**
 * FILE: web/frontend/src/pages/Trending.jsx
 * MỤC ĐÍCH: Trang thịnh hành - hiển thị các bài viết hot trong tuần
 */

import { useQuery } from "react-query";
import { postsAPI } from "../services/api";
import PostCard from "../components/Post/PostCard";
import Loading from "../components/UI/Loading";

const Trending = () => {
  const { data, isLoading, error } = useQuery(["trendingPosts"], () =>
    postsAPI.getTrendingPosts(20)
  );

  if (isLoading) return <Loading />;
  if (error)
    return <div className="alert alert-error">Lỗi khi tải thịnh hành</div>;

  const posts = data?.data || data?.posts || [];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Thịnh hành</h1>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          Chưa có bài viết thịnh hành
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} hideVoteButtons={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
