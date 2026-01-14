"use client";

import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";

export default function NoOrgLanding() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={8}>
      <VStack gap={3} maxW="520px" textAlign="center">
        <Heading size="lg">You’re not in an organization yet</Heading>
        <Text color="fg.muted">
          Ask an admin to invite you, or create an organization to start using projects, locations, sources, and sensors.
        </Text>

        {/* Placeholder actions (wire these later) */}
        <Button colorScheme="blue" variant="solid" disabled>
          Create organization (coming soon)
        </Button>
        <Button variant="outline" disabled>
          Request invite (coming soon)
        </Button>
      </VStack>
    </Box>
  );
}
