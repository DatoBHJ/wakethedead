import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { toast } from '@/components/ui/use-toast';
import { EnvelopeSimple, Copy, Check } from '@phosphor-icons/react';

const EmailContactButton = () => {
    const [copied, setCopied] = useState(false);
    const email = 'datobhj@gmail.com';
  
    const handleCopy = () => {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        toast({
          title: "Email address copied",
          description: "The email has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    };
  
    return (
      <Popover 
        position="top"
        content={
          <PopoverContent>
            <div className="grid gap-4">
              <h4 className="font-medium leading-none">Contact via Email</h4>
              <p className="text-xs text-muted-foreground">
                Click 'Copy Email' to copy the address, or 'Send' to open your email client.
              </p>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-2">
                  <Button
                    variant="outline"
                    className="col-span-2 justify-start text-xs sm:text-sm"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    <span className="truncate">Copy Email</span>
                  </Button>
                  <Button
                    variant="default"
                    className="col-span-1 px-0"
                    asChild
                  >
                    <a href={`mailto:${email}`} className="flex items-center justify-center w-full h-full">
                      <EnvelopeSimple className="mr-1 h-4 w-4" />
                      <span className="text-xs sm:text-sm">Send</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        }
      >
        <PopoverTrigger>
          <Button 
            variant="outline" 
            size="icon"
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <EnvelopeSimple className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
      </Popover>
    );
  };
  
  export default EmailContactButton;