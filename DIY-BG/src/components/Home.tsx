import { useState, useEffect } from 'react';
import { db } from '../config/firebase-config';
import { ref, onValue } from 'firebase/database';

const Home = () => {
    const [posts, setPosts] = useState<{ [key: string]: any }>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const postsRef = ref(db, 'posts')

        const unsubscribe = onValue(postsRef, (snapshot) => {
            if (snapshot.exists()) {
                setPosts(snapshot.val())
                setLoading(false)
            } else {
                setPosts({})
                setLoading(false)
                setError('No posts found!')
            }
        }, (error) => {
            console.error('Error fetching posts:', error)
            setError('Failed to load posts!')
            setLoading(false)
        })

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, [])

    if (loading) {
        return <div>Loading posts...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    // Converts object to array to show first (using reverse), later
    //tova moje go promenim
    const postsArray = Object.entries(posts).reverse()

    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '700px' }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
                <h2>Home view</h2>
                {postsArray.length > 0 ? (
                    postsArray.map(([postId, post]) => (
                        <div key={postId} className="card mb-3">
                            <div className="card-body">
                                <h5 className="card-title">{post.title}</h5>
                                <p className="card-text">{post.content.substring(0, 200)}...</p> {/* Show a preview */}
                                <p className="card-subtitle text-muted">
                                    by User: {post.handle} on {new Date(post.timestamp).toLocaleString()}
                                </p>
                                {/* ADD after Detailed View button */}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No posts available yet!</p>
                )}
            </div>
        </div>
    )
}

export default Home