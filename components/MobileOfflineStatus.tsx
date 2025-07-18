"use client";

import type { JSX } from "react";

import {
  Battery,
  BatteryLow,
  RefreshCw,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useMobileOffline } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileOfflineStatus(): JSX.Element {
  const isMobile = useIsMobile();
  const {
    isOnline,
    syncInProgress,
    batteryLevel,
    isCharging,
    networkType,
    storageUsed,
    maxStorage,
    lastSyncAt,
  } = useMobileOffline();

  if (!isMobile) return <></>;

  const getNetworkIcon = (): JSX.Element => {
    switch (networkType) {
      case "wifi":
        return <Wifi className="h-3 w-3" />;
      case "4g":
        return <SignalHigh className="h-3 w-3" />;
      case "3g":
        return <SignalMedium className="h-3 w-3" />;
      case "slow-2g":
        return <SignalLow className="h-3 w-3" />;
      default:
        return <Signal className="h-3 w-3" />;
    }
  };

  const getBatteryIcon = (): JSX.Element => {
    if (batteryLevel < 0.2) {
      return <BatteryLow className="h-3 w-3 text-red-500" />;
    }
    return <Battery className="h-3 w-3" />;
  };

  const formatStorageUsed = (): string => {
    const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
    const maxMB = (maxStorage / (1024 * 1024)).toFixed(0);
    return `${usedMB}/${maxMB}MB`;
  };

  const formatLastSync = (): string => {
    if (!lastSyncAt) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastSyncAt.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Mobile Status</span>
          </div>

          {syncInProgress && (
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="text-xs text-muted-foreground">Syncing...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Connection Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className="text-xs"
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Network Type */}
          <div className="flex items-center gap-1">
            {getNetworkIcon()}
            <span className="text-muted-foreground">
              {networkType.toUpperCase()}
            </span>
          </div>

          {/* Battery Status */}
          <div className="flex items-center gap-1">
            {getBatteryIcon()}
            <span className="text-muted-foreground">
              {Math.round(batteryLevel * 100)}%{isCharging && " ⚡"}
            </span>
          </div>

          {/* Storage Usage */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">
              💾 {formatStorageUsed()}
            </span>
          </div>
        </div>

        {/* Last Sync */}
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Last sync: {formatLastSync()}
            </span>

            {!isOnline && (
              <Badge variant="outline" className="text-xs">
                Changes queued for sync
              </Badge>
            )}
          </div>
        </div>

        {/* Low battery warning */}
        {batteryLevel < 0.2 && !isCharging && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Low battery - sync paused to save power
          </div>
        )}
      </CardContent>
    </Card>
  );
}
