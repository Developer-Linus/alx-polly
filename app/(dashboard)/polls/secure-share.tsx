"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Share2, Twitter, Facebook, Mail } from "lucide-react";
import { toast } from "sonner";

interface SecureShareProps {
  pollId: string;
  pollTitle: string;
}

// Security utility functions
function sanitizeText(text: string): string {
  return text
    .replace(/[<>"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[match];
    })
    .slice(0, 200); // Limit length to prevent abuse
}

function isValidPollId(pollId: string): boolean {
  // Validate poll ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(pollId);
}

function secureWindowOpen(url: string): void {
  // Add security attributes to prevent window.opener access
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.opener = null;
  }
}

export default function SecureShare({
  pollId,
  pollTitle,
}: SecureShareProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isValidPoll, setIsValidPoll] = useState(false);

  useEffect(() => {
    // Validate poll ID
    if (!isValidPollId(pollId)) {
      console.error('Invalid poll ID format');
      setIsValidPoll(false);
      return;
    }

    setIsValidPoll(true);
    
    // Generate the share URL with validation
    try {
      const baseUrl = window.location.origin;
      const pollUrl = `${baseUrl}/polls/${encodeURIComponent(pollId)}`;
      setShareUrl(pollUrl);
    } catch (error) {
      console.error('Error generating share URL:', error);
      toast.error('Failed to generate share URL');
    }
  }, [pollId]);

  const copyToClipboard = async () => {
    if (!shareUrl || !isValidPoll) {
      toast.error('Invalid poll data');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error('Failed to copy link');
    }
  };

  const shareOnTwitter = () => {
    if (!shareUrl || !isValidPoll) {
      toast.error('Invalid poll data');
      return;
    }

    try {
      const sanitizedTitle = sanitizeText(pollTitle);
      const text = encodeURIComponent(`Check out this poll: ${sanitizedTitle}`);
      const url = encodeURIComponent(shareUrl);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      secureWindowOpen(twitterUrl);
    } catch (error) {
      console.error('Twitter share error:', error);
      toast.error('Failed to share on Twitter');
    }
  };

  const shareOnFacebook = () => {
    if (!shareUrl || !isValidPoll) {
      toast.error('Invalid poll data');
      return;
    }

    try {
      const url = encodeURIComponent(shareUrl);
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      secureWindowOpen(facebookUrl);
    } catch (error) {
      console.error('Facebook share error:', error);
      toast.error('Failed to share on Facebook');
    }
  };

  const shareViaEmail = () => {
    if (!shareUrl || !isValidPoll) {
      toast.error('Invalid poll data');
      return;
    }

    try {
      const sanitizedTitle = sanitizeText(pollTitle);
      const subject = encodeURIComponent(`Poll: ${sanitizedTitle}`);
      const body = encodeURIComponent(
        `Hi! I'd like to share this poll with you: ${shareUrl}`
      );
      const emailUrl = `mailto:?subject=${subject}&body=${body}`;
      window.location.href = emailUrl;
    } catch (error) {
      console.error('Email share error:', error);
      toast.error('Failed to open email client');
    }
  };

  if (!isValidPoll) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">Invalid Poll</CardTitle>
          <CardDescription>
            This poll cannot be shared due to invalid data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share This Poll
        </CardTitle>
        <CardDescription>
          Share your poll with others to gather votes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Shareable Link
          </label>
          <div className="flex space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="font-mono text-sm"
              placeholder="Generating secure link..."
            />
            <Button onClick={copyToClipboard} variant="outline" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Social Sharing Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Share on social media
          </label>
          <div className="flex space-x-2">
            <Button
              onClick={shareOnTwitter}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              onClick={shareOnFacebook}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}