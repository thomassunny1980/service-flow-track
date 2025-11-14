import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Clock, CheckCircle, Send, Truck, FileCheck } from "lucide-react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";

type StatusCounts = {
  received: number;
  in_progress: number;
  awaiting_parts: number;
  completed: number;
  external_service: number;
  ready_for_pickup: number;
  delivered: number;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StatusCounts>({
    received: 0,
    in_progress: 0,
    awaiting_parts: 0,
    completed: 0,
    external_service: 0,
    ready_for_pickup: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchStatusCounts();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("status");

      if (error) throw error;

      const newCounts: StatusCounts = {
        received: 0,
        in_progress: 0,
        awaiting_parts: 0,
        completed: 0,
        external_service: 0,
        ready_for_pickup: 0,
        delivered: 0,
      };

      data?.forEach((product) => {
        if (product.status in newCounts) {
          newCounts[product.status as keyof StatusCounts]++;
        }
      });

      setCounts(newCounts);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching status counts:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusCards = [
    {
      title: "Received",
      count: counts.received,
      icon: Package,
      color: "text-status-received",
      bgColor: "bg-status-received/10",
    },
    {
      title: "In Progress",
      count: counts.in_progress,
      icon: Wrench,
      color: "text-status-inProgress",
      bgColor: "bg-status-inProgress/10",
    },
    {
      title: "Awaiting Parts",
      count: counts.awaiting_parts,
      icon: Clock,
      color: "text-status-awaitingParts",
      bgColor: "bg-status-awaitingParts/10",
    },
    {
      title: "Completed",
      count: counts.completed,
      icon: CheckCircle,
      color: "text-status-completed",
      bgColor: "bg-status-completed/10",
    },
    {
      title: "External Service",
      count: counts.external_service,
      icon: Send,
      color: "text-status-external",
      bgColor: "bg-status-external/10",
    },
    {
      title: "Ready for Pickup",
      count: counts.ready_for_pickup,
      icon: FileCheck,
      color: "text-status-ready",
      bgColor: "bg-status-ready/10",
    },
    {
      title: "Delivered",
      count: counts.delivered,
      icon: Truck,
      color: "text-status-delivered",
      bgColor: "bg-status-delivered/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Overview of all service items by status
              </p>
            </div>
            {userName && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="text-lg font-semibold">{userName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((card) => (
            <Card
              key={card.title}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => navigate(`/products?status=${card.title.toLowerCase().replace(/ /g, '_')}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} rounded-full p-2`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : card.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {card.count === 1 ? "item" : "items"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {loading
                ? "..."
                : Object.values(counts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-muted-foreground">
              Total products in service
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
