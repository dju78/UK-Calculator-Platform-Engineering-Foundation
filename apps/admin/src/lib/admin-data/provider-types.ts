export type ExternalProviderStatus =
  | "CONNECTED"
  | "CONFIGURED"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "AUTH_ERROR"
  | "PERMISSION_DENIED"
  | "ERROR";

export interface ExternalProviderInfo {
  provider: string;
  service: string;
  status: ExternalProviderStatus;
  statusLabel: string;
  isFreeTier: boolean;
  costNote: string;
  credentialRequirements: string[];
  lastChecked: string;
  errorMessage?: string;
}
