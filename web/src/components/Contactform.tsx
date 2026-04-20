import { useMemo,} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

import {z} from "zod";
import {
  Send,
  MapPin as Location,
  Mail as Email,
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
// Define contact message schema locally since we're using Flask backend
const insertContactMessageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  phone: z.string().optional(),
  preferredContactMethod: z.string().optional(),
});
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type ContactFormValues = z.infer<typeof insertContactMessageSchema>;

export function ContactForm() {
  const defaultValues = useMemo<ContactFormValues>(
    () => ({
      name: "",
      email: "",
      subject: "",
      message: "",
    }),
    []
  );

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(insertContactMessageSchema),
    defaultValues,
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return await apiRequest("POST", "/api/contact/", data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      contactForm.reset();
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again later or contact me directly.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...contactForm}>
      <form
        onSubmit={contactForm.handleSubmit((data: ContactFormValues) =>
          contactMutation.mutate(data)
        )}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={contactForm.control}
            name="name"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" className="rounded-lg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={contactForm.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your@email.com"
                    type="email"
                    className="rounded-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={contactForm.control}
          name="subject"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input
                  placeholder="What's this about?"
                  className="rounded-lg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={contactForm.control}
          name="message"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell me about your project or just say hello..."
                  className="min-h-[120px] rounded-lg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-primary text-white btn-enhanced rounded-lg py-3"
          disabled={contactMutation.isPending}
        >
          <Send className="mr-2 h-4 w-4" />
          {contactMutation.isPending ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Form>
  );
}