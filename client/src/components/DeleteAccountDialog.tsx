import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AlertTriangle } from "lucide-react";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [step, setStep] = useState<"warning" | "confirm">("warning");

  const { data: eligibility } = trpc.auth.checkDeletionEligibility.useQuery(undefined, {
    enabled: open,
  });

  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      // Account deleted successfully, redirect to home
      window.location.href = "/";
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setStep("warning");
  };

  const canProceed = eligibility?.canDelete ?? false;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Account
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            {step === "warning" && (
              <>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Delete Account
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone. This will permanently delete
                      your account and remove your personal data from our servers.
                    </p>
                  </div>
                </div>

                {!canProceed && eligibility && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">
                      Cannot Delete Account
                    </h3>
                    <ul className="text-sm text-red-800 space-y-1">
                      {eligibility.blockers.map((blocker, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{blocker}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {canProceed && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          What will be deleted:
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Your name, email, and contact information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Your profile picture</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Your account credentials</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>All active sessions</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          What will be kept (anonymized):
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>
                              Past appointment records (for other users, with your
                              information anonymized)
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Message history (anonymized)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {canProceed && (
                    <button
                      onClick={() => setStep("confirm")}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Confirm Account Deletion
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Please enter your password and type DELETE to confirm.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmation"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Type <strong>DELETE</strong> to confirm
                    </label>
                    <input
                      id="confirmation"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep("warning")}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={deleteAccount.isPending}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (confirmation === "DELETE") {
                        deleteAccount.mutate({ password, confirmation: "DELETE" });
                      }
                    }}
                    disabled={
                      !password ||
                      confirmation !== "DELETE" ||
                      deleteAccount.isPending
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteAccount.isPending ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
