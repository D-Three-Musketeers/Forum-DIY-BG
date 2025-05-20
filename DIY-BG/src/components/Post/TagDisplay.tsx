import { Link } from "react-router-dom";


interface TagDisplayProps {
  tags: string[];
  maxTags?: number;
}

const TagDisplay: React.FC<TagDisplayProps> = ({ tags, maxTags = 3 }) => {
  if (!tags || tags.length === 0) return null;

  const displayedTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingTags = maxTags ? tags.length - maxTags : 0;

  return (
    <div className="d-flex flex-wrap gap-1 mb-2">
      {displayedTags.map((tag, index) => (
        <Link
          key={index}
          to={`/home?tag=${encodeURIComponent(tag)}`}
          className="badge bg-secondary text-decoration-none"
        >
          #{tag}
        </Link>
      ))}
      {remainingTags > 0 && (
        <span className="badge bg-secondary">
          +{remainingTags} more
        </span>
      )}
    </div>
  );
};

export default TagDisplay;