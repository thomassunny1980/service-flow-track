 import { useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Download, Smartphone, Monitor, CheckCircle2, ArrowLeft } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 
 interface BeforeInstallPromptEvent extends Event {
   prompt: () => Promise<void>;
   userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
 }
 
 const Install = () => {
   const navigate = useNavigate();
   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
   const [isInstalled, setIsInstalled] = useState(false);
   const [isIOS, setIsIOS] = useState(false);
 
   useEffect(() => {
     // Check if already installed
     if (window.matchMedia("(display-mode: standalone)").matches) {
       setIsInstalled(true);
     }
 
     // Detect iOS
     const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
     setIsIOS(isIOSDevice);
 
     // Listen for the beforeinstallprompt event
     const handleBeforeInstallPrompt = (e: Event) => {
       e.preventDefault();
       setDeferredPrompt(e as BeforeInstallPromptEvent);
     };
 
     window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
 
     // Listen for successful installation
     window.addEventListener("appinstalled", () => {
       setIsInstalled(true);
       setDeferredPrompt(null);
     });
 
     return () => {
       window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
     };
   }, []);
 
   const handleInstallClick = async () => {
     if (!deferredPrompt) return;
 
     await deferredPrompt.prompt();
     const { outcome } = await deferredPrompt.userChoice;
 
     if (outcome === "accepted") {
       setIsInstalled(true);
     }
     setDeferredPrompt(null);
   };
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
       <Card className="w-full max-w-md">
         <CardHeader className="text-center">
           <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
             <Smartphone className="h-8 w-8 text-primary-foreground" />
           </div>
           <CardTitle className="text-2xl">Install I-TECH App</CardTitle>
           <CardDescription>
             Install our app for a better experience with offline access and quick launch
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           {isInstalled ? (
             <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
               </div>
               <p className="text-muted-foreground">
                 App is already installed! You can launch it from your home screen.
               </p>
               <Button onClick={() => navigate("/")} className="w-full">
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 Go to App
               </Button>
             </div>
           ) : isIOS ? (
             <div className="space-y-4">
               <p className="text-sm text-muted-foreground text-center">
                 To install on iOS:
               </p>
               <ol className="space-y-3 text-sm">
                 <li className="flex items-start gap-3">
                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                     1
                   </span>
                   <span>Tap the Share button in Safari</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                     2
                   </span>
                   <span>Scroll down and tap "Add to Home Screen"</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                     3
                   </span>
                   <span>Tap "Add" to confirm</span>
                 </li>
               </ol>
               <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 Back to App
               </Button>
             </div>
           ) : deferredPrompt ? (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4 text-center text-sm">
                 <div className="p-4 rounded-lg bg-muted">
                   <Monitor className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                   <p>Works offline</p>
                 </div>
                 <div className="p-4 rounded-lg bg-muted">
                   <Download className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                   <p>Quick launch</p>
                 </div>
               </div>
               <Button onClick={handleInstallClick} className="w-full" size="lg">
                 <Download className="mr-2 h-4 w-4" />
                 Install App
               </Button>
               <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                 Maybe later
               </Button>
             </div>
           ) : (
             <div className="text-center space-y-4">
               <p className="text-sm text-muted-foreground">
                 Open this page in Chrome, Edge, or Safari to install the app.
               </p>
               <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 Back to App
               </Button>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default Install;