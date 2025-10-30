import { useQuery } from "react-query";
import { postsAPI } from "../services/api";
import PostCard from "../components/Post/PostCard";
import Loading from "../components/UI/Loading";

const SavedPosts = () => {
  const { data, isLoading, error } = useQuery(["savedPosts"], () =>
    postsAPI.getSavedPosts()
  );

  if (isLoading) return <Loading />;
  if (error)
    return <div className="alert alert-error">Lỗi khi tải bài viết đã lưu</div>;

  const posts = data?.data?.posts || data?.posts || [];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Bài viết đã lưu</h1>
      {posts.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">
          Bạn chưa lưu bài viết nào
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

export default SavedPosts;
