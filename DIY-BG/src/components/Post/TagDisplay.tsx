import { Link } from "react-router-dom";

interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

const TagDisplay: React.FC<TagDisplayProps> = ({ tags, onTagClick }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="mb-2">
      {tags.map((tag, index) => (
        <Link
          key={index}
          to={`/search?tag=${encodeURIComponent(tag)}`}
          className="badge bg-primary me-1 text-decoration-none"
          onClick={(e) => {
            if (onTagClick) {
              e.preventDefault();
              onTagClick(tag);
            }
          }}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
};

export default TagDisplay;