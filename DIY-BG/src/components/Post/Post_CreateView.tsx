import { useState, useContext, useEffect } from "react";
import { storage } from "../../config/firebase-config";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { AppContext } from "../../state/App.context";
import { useNavigate } from "react-router-dom";
import Hero from "../Hero";
import { createPost } from "../../services/posts.service";
import { DIYCategories, type DIYCategory } from "../../enums/diy-enums";
// import { push, ref, } from "firebase/database";
// import { db } from "../../config/firebase-config";
import { checkIfBanned } from "../../services/users.service";
import { useTranslation } from "react-i18next";
import TagInput from "./TagInput";

const LOCAL_STORAGE_TITLE_KEY = "draftPostTitle";
const LOCAL_STORAGE_CONTENT_KEY = "draftPostContent";
const LOCAL_STORAGE_IMAGES_KEY = "draftPostImages";

const Post_CreateView = () => {
  const { t } = useTranslation();
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [category, setCategory] = useState<DIYCategory | "">("");
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const savedTitle = localStorage.getItem(LOCAL_STORAGE_TITLE_KEY);
    const savedContent = localStorage.getItem(LOCAL_STORAGE_CONTENT_KEY);
    const savedImages = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY);

    if (savedTitle) setTitle(savedTitle);
    if (savedContent) setContent(savedContent);
    if (savedImages) setImages(JSON.parse(savedImages));
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    localStorage.setItem(LOCAL_STORAGE_TITLE_KEY, newTitle);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    localStorage.setItem(LOCAL_STORAGE_CONTENT_KEY, newContent);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (await checkIfBanned(userData.uid)) return;
    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files);
        const MAX_SIZE = 1 * 1024 * 1024;
        const validFiles = files.filter((file) => file.size <= MAX_SIZE);

        if (validFiles.length !== files.length) {
          alert(t("create.imageTooLarge"));
        }

        // Upload each file to Firebase Storage and get the download URL
        const uploadPromises = validFiles.map(async (file) => {
          const uniqueName = `${userData.uid}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 10)}_${file.name}`;
          const imgRef = storageRef(storage, `post_images/${uniqueName}`);
          await uploadBytes(imgRef, file);
          return await getDownloadURL(imgRef);
        });

        const urls = await Promise.all(uploadPromises);
        const newImages = [...images, ...urls];

        setImages(newImages);
        localStorage.setItem(
          LOCAL_STORAGE_IMAGES_KEY,
          JSON.stringify(newImages)
        );
      } catch (error) {
        console.error("Error uploading images:", error);
        alert(t("create.imageProcessError"));
      }
    }
  };

  const removeImage = async (index: number) => {
    if (await checkIfBanned(userData.uid)) return;
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(newImages));
  };

  const handlePost = async () => {
    if (await checkIfBanned(userData.uid)) return;
    if (!user) {
      alert(t("create.mustLogin"));
      return;
    }

    setPosting(true);
    try {
      await createPost(
        title,
        content,
        user.uid,
        userData.handle,
        new Date().toISOString(),
        category,
        tags, // Pass the raw tags array
        images
      );

      // Reset form
      setTitle("");
      setContent("");
      setCategory("");
      setImages([]);
      setTags([]);
      localStorage.removeItem(LOCAL_STORAGE_TITLE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CONTENT_KEY);
      localStorage.removeItem(LOCAL_STORAGE_IMAGES_KEY);

      navigate("/home");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Post creation failed:", {
          message: error.message,
          stack: error.stack,
          tagsAtError: [...tags],
        });
      } else {
        console.error("Unknown error type:", error);
      }
      alert(t("create.saveError"));
    } finally {
      setPosting(false);
    }
  };

  const handleAbort = () => {
    if (window.confirm(t("create.abortConfirm"))) {
      setTitle("");
      setContent("");
      setCategory("");
      setImages([]);
      setTags([]);
      localStorage.removeItem(LOCAL_STORAGE_TITLE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CONTENT_KEY);
      localStorage.removeItem(LOCAL_STORAGE_IMAGES_KEY);
      navigate("/create-post");
    }
  };

  if (!user) {
    return (
      <>
        <Hero />
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
          <div
            className="card p-4 shadow"
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#f8f9fa",
              textAlign: "center",
              marginBottom: "500px",
            }}
          >
            <div className="card-body">
              <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
                {t("create.mustLoginInline")}{" "}
                <span
                  className="clickable-link"
                  onClick={() => navigate("/loginpage")}
                >
                  {t("hero.login")}
                </span>
              </p>
              <p style={{ fontSize: "1rem" }}>
                {t("create.noAccount")}{" "}
                <span
                  className="clickable-link"
                  onClick={() => navigate("/signinpage")}
                >
                  {t("hero.signup")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero />
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div
          className="card p-4 shadow"
          style={{
            width: "100%",
            maxWidth: "700px",
            backgroundColor: "#f8f9fa",
            marginBottom: "300px",
          }}
        >
          <div className="card-body">
            <h3 className="card-title text-center mb-4">{t("create.title")}</h3>

            <div className="mb-3">
              <label htmlFor="postTitle" className="form-label">
                {t("create.postTitle")}
              </label>
              <input
                type="text"
                className="form-control"
                id="postTitle"
                placeholder={t("create.titlePlaceholder")}
                value={title}
                onChange={handleTitleChange}
              />
              {title.length < 16 || title.length > 64 ? (
                <div className="form-text text-danger">
                  {t("create.titleError")}
                </div>
              ) : (
                <div className="form-text text-success">
                  {t("create.titleValid")}
                </div>
              )}
            </div>
            <div className="mb-3">
              <TagInput initialTags={tags} onTagsChange={setTags} />
            </div>
            <div className="mb-3">
              <label htmlFor="postContent" className="form-label">
                {t("create.postContent")}
              </label>
              <textarea
                className="form-control"
                id="postContent"
                rows={8}
                placeholder={t("create.contentPlaceholder")}
                value={content}
                onChange={handleContentChange}
              />
              {content.length < 32 || content.length > 8192 ? (
                <div className="form-text text-danger">
                  {t("create.contentError")}
                </div>
              ) : (
                <div className="form-text text-success">
                  {t("create.contentValid")}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="postImages" className="form-label">
                {t("create.imagesLabel")}
              </label>
              <input
                type="file"
                className="form-control"
                id="postImages"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
              <div className="d-flex flex-wrap gap-2 mt-2">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="position-relative"
                    style={{ width: "100px" }}
                  >
                    <img
                      src={img}
                      alt={`Preview ${index}`}
                      className="img-thumbnail"
                      style={{ height: "100px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0"
                      onClick={() => removeImage(index)}
                      style={{ padding: "0.15rem 0.3rem" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="postCategory" className="form-label">
                {t("create.categoryLabel")}
              </label>
              <select
                className="form-control"
                id="postCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as DIYCategory)}
                required
              >
                <option value="" disabled>
                  {t("create.categoryPlaceholder")}
                </option>
                {DIYCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`home.categories.${cat}`)}
                  </option>
                ))}
              </select>
              {!category && (
                <div className="form-text text-danger">
                  {t("create.categoryError")}
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between">
              <button
                className="btn btn-primary"
                onClick={handlePost}
                disabled={
                  posting ||
                  title.length < 16 ||
                  title.length > 64 ||
                  content.length < 32 ||
                  content.length > 8192 ||
                  !user ||
                  !category
                }
              >
                {posting ? t("create.posting") : t("create.postButton")}
              </button>
              <button className="btn btn-secondary" onClick={handleAbort}>
                {t("create.abortButton")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Post_CreateView;
