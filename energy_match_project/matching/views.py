from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.services import notify_new_matches

from .reflection_vibes import attach_energy_vibes_to_ranked
from .serializers import MatchSerializer
from .services import rank_matches


@extend_schema(
    tags=["Matching"],
    summary="Energy Match — ranked compatibility list",
    description=(
        "Returns ranked match suggestions for the authenticated user. "
        "Score = 0.8 * cosine_similarity(interests) + 0.2 * mood_compatibility. "
        "Side effect: high-score (>=0.5) candidates receive a `new_match` notification."
    ),
    parameters=[
        OpenApiParameter(
            name="limit",
            description="Max matches to return (1–50). Default 10.",
            required=False,
            type=int,
        ),
    ],
    responses={200: MatchSerializer(many=True)},
)
class MatchListView(APIView):
    """GET /api/matches/?limit=10"""

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 10))
        except (TypeError, ValueError):
            limit = 10
        limit = max(1, min(limit, 50))

        ranked = rank_matches(request.user.profile, limit=limit)
        attach_energy_vibes_to_ranked(ranked)
        notify_new_matches(request.user, ranked)
        data = MatchSerializer(ranked, many=True).data
        return Response({"count": len(data), "results": data})
