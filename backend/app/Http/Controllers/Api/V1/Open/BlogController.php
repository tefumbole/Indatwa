<?php

namespace App\Http\Controllers\Api\V1\Open;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BlogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('blog_posts')
            ->where('status', 'published')
            ->orderByDesc('published_at');

        $posts = $query->paginate((int) $request->query('per_page', 12));

        return response()->json([
            'success' => true,
            'data' => collect($posts->items())->map(function ($post) {
                return $this->formatPost($post, true);
            }),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = DB::table('blog_posts')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (! $post) {
            return response()->json(['success' => false, 'message' => 'Post not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatPost($post, false),
        ]);
    }

    private function formatPost(object $post, bool $summary): array
    {
        $data = [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image,
            'author_name' => $post->author_name,
            'published_at' => $post->published_at,
        ];

        if (! $summary) {
            $data['content'] = $post->content;
        }

        return $data;
    }
}
