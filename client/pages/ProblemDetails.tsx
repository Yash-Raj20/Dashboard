"use client";

import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { fetchApi } from "@shared/api";
import { Problem } from "./AllProblems";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Tag,
  AlertTriangle,
  BadgeCheck,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProblemDetails() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const cached = sessionStorage.getItem(`problem-${id}`);
    if (cached) {
      setProblem(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      const res = await fetchApi<any>(`problems/${id}`);
      const data = res?.problem || res;

      if (!data) {
        setError("Problem not found");
        return;
      }

      const mapped: Problem = { ...data, id: data._id };
      setProblem(mapped);
      sessionStorage.setItem(`problem-${id}`, JSON.stringify(mapped));
    } catch (err) {
      console.error(err);
      setError("Failed to load problem");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // Tailwind badge helpers
  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          label: "Pending",
          className:
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
      case "process":
        return {
          label: "In Progress",
          className:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        };
      case "resolved":
        return {
          label: "Resolved",
          className:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        };
      default:
        return {
          label: status || "Unknown",
          className:
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical":
        return {
          label: "Critical",
          className:
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        };
      case "high":
        return {
          label: "High",
          className:
            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        };
      case "moderate":
        return {
          label: "Moderate",
          className:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        };
      case "low":
        return {
          label: "Low",
          className:
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
      default:
        return {
          label: "Unknown",
          className:
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Card className="p-6 text-center bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-md">
          <MessageCircle className="mx-auto mb-4 w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            Loading problem details...
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  if (error || !problem) {
    return (
      <DashboardLayout>
        <Card className="p-6 text-center bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-md">
          <AlertTriangle className="mx-auto mb-4 w-12 h-12 text-red-500 dark:text-red-400" />
          <p className="text-red-600 dark:text-red-400 text-lg">
            {error || "Problem not found"}
          </p>
        </Card>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(problem.status);
  const urgencyBadge = getUrgencyBadge(problem.urgency);

  return (
    <DashboardLayout>
      <Card className="max-w-5xl mx-auto pb-5">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center justify-between text-gray-900 dark:text-gray-100">
            {problem.title}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                onClick={() => navigator.clipboard.writeText(problem.id)}
              >
                <span className="flex items-center gap-2 cursor-pointer">
                  <Share2 className="w-5 h-5" />
                  Share
                </span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {problem.image && (
            <img
              src={problem.image}
              alt={problem.title}
              loading="lazy"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm object-cover max-h-96"
            />
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {problem.description}
            </p>
          </div>

          <Separator className="border-gray-200 dark:border-gray-700" />

          <div className="grid grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {/* Left Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="font-medium">Category:</span>
                <span>{problem.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500 dark:text-red-400" />
                <span className="font-medium">Location:</span>
                <span>
                  {problem.location}, {problem.district}, {problem.state}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <span className="font-medium">Upvotes:</span>
                <span>
                  {problem.upvotes?.length || 0} upvote
                  {problem.upvotes?.length !== 1 && "s"}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="font-medium">Urgency:</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${urgencyBadge.className}`}
                >
                  {problem.urgency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span className="font-medium">Status:</span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span className="font-medium">Contact:</span>
                <span>{problem.contact}</span>
              </div>
            </div>
          </div>

          <Separator className="border-gray-200 dark:border-gray-700" />

          <div className="grid sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <span className="font-medium">Created At:</span>
              <span>
                {new Date(problem.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Reported By:</span>
              <span>{problem.userId?.name || "Anonymous"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
