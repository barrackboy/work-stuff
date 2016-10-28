/*
 * Copyright (c) 2010 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.cometd.server.authorizer;

import org.cometd.bayeux.ChannelId;
import org.cometd.bayeux.Message;
import org.cometd.bayeux.server.Authorizer;
import org.cometd.bayeux.server.ConfigurableServerChannel;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.common.JSONContext;
import org.cometd.common.JettyJSONContextClient;
import org.cometd.server.AbstractBayeuxClientServerTest;
import org.eclipse.jetty.client.ContentExchange;
import org.eclipse.jetty.client.HttpExchange;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class AuthorizerTest extends AbstractBayeuxClientServerTest
{
    @Before
    public void prepare() throws Exception
    {
        startServer(null);
    }

    @Test
    public void testAuthorizersOnSlashStarStar() throws Exception
    {
        bayeux.createChannelIfAbsent("/**", new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(ConfigurableServerChannel channel)
            {
                // Grant create and subscribe to all and publishes only to service channels
                channel.addAuthorizer(GrantAuthorizer.GRANT_CREATE_SUBSCRIBE);
                channel.addAuthorizer(new Authorizer()
                {
                    public Result authorize(Operation operation, ChannelId channel, ServerSession session, ServerMessage message)
                    {
                        if (operation == Operation.PUBLISH && channel.isService())
                            return Result.grant();
                        return Result.ignore();
                    }
                });
            }
        });

        ContentExchange handshake = newBayeuxExchange("[{" +
                "\"channel\": \"/meta/handshake\"," +
                "\"version\": \"1.0\"," +
                "\"minimumVersion\": \"1.0\"," +
                "\"supportedConnectionTypes\": [\"long-polling\"]" +
                "}]");
        httpClient.send(handshake);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, handshake.waitForDone());
        Assert.assertEquals(200, handshake.getResponseStatus());

        String clientId = extractClientId(handshake);

        ContentExchange publish = newBayeuxExchange("[{" +
                "\"channel\": \"/foo\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        JSONContext.Client jsonContext = new JettyJSONContextClient();
        Message.Mutable[] messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        Message message = messages[0];
        Assert.assertFalse(message.isSuccessful());

        publish = newBayeuxExchange("[{" +
                "\"channel\": \"/service/foo\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        message = messages[0];
        Assert.assertTrue(message.isSuccessful());
    }

    @Test
    public void testIgnoringAuthorizerDenies() throws Exception
    {
        String channelName = "/test";
        bayeux.createChannelIfAbsent(channelName, new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(ConfigurableServerChannel channel)
            {
                channel.addAuthorizer(new Authorizer()
                {
                    public Result authorize(Operation operation, ChannelId channel, ServerSession session, ServerMessage message)
                    {
                        return Result.ignore();
                    }
                });
            }
        });

        ContentExchange handshake = newBayeuxExchange("[{" +
                "\"channel\": \"/meta/handshake\"," +
                "\"version\": \"1.0\"," +
                "\"minimumVersion\": \"1.0\"," +
                "\"supportedConnectionTypes\": [\"long-polling\"]" +
                "}]");
        httpClient.send(handshake);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, handshake.waitForDone());
        Assert.assertEquals(200, handshake.getResponseStatus());

        String clientId = extractClientId(handshake);

        ContentExchange publish = newBayeuxExchange("[{" +
                "\"channel\": \"" + channelName + "\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        JSONContext.Client jsonContext = new JettyJSONContextClient();
        Message.Mutable[] messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        Message message = messages[0];
        Assert.assertFalse(message.isSuccessful());

        // Check that publishing to another channel does not involve authorizers
        ContentExchange grantedPublish = newBayeuxExchange("[{" +
                "\"channel\": \"/foo\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(grantedPublish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, grantedPublish.waitForDone());
        Assert.assertEquals(200, grantedPublish.getResponseStatus());

        messages = jsonContext.parse(grantedPublish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        message = messages[0];
        Assert.assertTrue(message.isSuccessful());
    }

    @Test
    public void testNoAuthorizersGrant() throws Exception
    {
        ContentExchange handshake = newBayeuxExchange("[{" +
                "\"channel\": \"/meta/handshake\"," +
                "\"version\": \"1.0\"," +
                "\"minimumVersion\": \"1.0\"," +
                "\"supportedConnectionTypes\": [\"long-polling\"]" +
                "}]");
        httpClient.send(handshake);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, handshake.waitForDone());
        Assert.assertEquals(200, handshake.getResponseStatus());

        String clientId = extractClientId(handshake);

        ContentExchange publish = newBayeuxExchange("[{" +
                "\"channel\": \"/test\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        JSONContext.Client jsonContext = new JettyJSONContextClient();
        Message.Mutable[] messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        Message message = messages[0];
        Assert.assertTrue(message.isSuccessful());
    }

    @Test
    public void testDenyAuthorizerDenies() throws Exception
    {
        bayeux.createChannelIfAbsent("/test/*", new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(ConfigurableServerChannel channel)
            {
                channel.addAuthorizer(GrantAuthorizer.GRANT_ALL);
            }
        });
        String channelName = "/test/denied";
        bayeux.createChannelIfAbsent(channelName, new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(ConfigurableServerChannel channel)
            {
                channel.addAuthorizer(new Authorizer()
                {
                    public Result authorize(Operation operation, ChannelId channel, ServerSession session, ServerMessage message)
                    {
                        return Result.deny("test");
                    }
                });
            }
        });

        ContentExchange handshake = newBayeuxExchange("[{" +
                "\"channel\": \"/meta/handshake\"," +
                "\"version\": \"1.0\"," +
                "\"minimumVersion\": \"1.0\"," +
                "\"supportedConnectionTypes\": [\"long-polling\"]" +
                "}]");
        httpClient.send(handshake);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, handshake.waitForDone());
        Assert.assertEquals(200, handshake.getResponseStatus());

        String clientId = extractClientId(handshake);

        ContentExchange publish = newBayeuxExchange("[{" +
                "\"channel\": \"" + channelName + "\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        JSONContext.Client jsonContext = new JettyJSONContextClient();
        Message.Mutable[] messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        Message message = messages[0];
        Assert.assertFalse(message.isSuccessful());

        // Check that publishing to another channel does not involve authorizers
        ContentExchange grantedPublish = newBayeuxExchange("[{" +
                "\"channel\": \"/foo\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(grantedPublish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, grantedPublish.waitForDone());
        Assert.assertEquals(200, grantedPublish.getResponseStatus());

        messages = jsonContext.parse(grantedPublish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        message = messages[0];
        Assert.assertTrue(message.isSuccessful());
    }

    @Test
    public void testAddRemoveAuthorizer() throws Exception
    {
        bayeux.createChannelIfAbsent("/test/*", new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(ConfigurableServerChannel channel)
            {
                channel.addAuthorizer(GrantAuthorizer.GRANT_NONE);
            }
        });
        String channelName = "/test/granted";
        bayeux.createChannelIfAbsent(channelName, new ConfigurableServerChannel.Initializer()
        {
            public void configureChannel(final ConfigurableServerChannel channel)
            {
                channel.addAuthorizer(new Authorizer()
                {
                    public Result authorize(Operation operation, ChannelId channelId, ServerSession session, ServerMessage message)
                    {
                        channel.removeAuthorizer(this);
                        return Result.grant();
                    }
                });
            }
        });

        ContentExchange handshake = newBayeuxExchange("[{" +
                "\"channel\": \"/meta/handshake\"," +
                "\"version\": \"1.0\"," +
                "\"minimumVersion\": \"1.0\"," +
                "\"supportedConnectionTypes\": [\"long-polling\"]" +
                "}]");
        httpClient.send(handshake);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, handshake.waitForDone());
        Assert.assertEquals(200, handshake.getResponseStatus());

        String clientId = extractClientId(handshake);

        ContentExchange publish = newBayeuxExchange("[{" +
                "\"channel\": \"" + channelName + "\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(publish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, publish.waitForDone());
        Assert.assertEquals(200, publish.getResponseStatus());

        JSONContext.Client jsonContext = new JettyJSONContextClient();
        Message.Mutable[] messages = jsonContext.parse(publish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        Message message = messages[0];
        Assert.assertTrue(message.isSuccessful());

        // Check that publishing again fails (the authorizer has been removed)
        ContentExchange grantedPublish = newBayeuxExchange("[{" +
                "\"channel\": \"" + channelName + "\"," +
                "\"clientId\": \"" + clientId + "\"," +
                "\"data\": {}" +
                "}]");
        httpClient.send(grantedPublish);
        Assert.assertEquals(HttpExchange.STATUS_COMPLETED, grantedPublish.waitForDone());
        Assert.assertEquals(200, grantedPublish.getResponseStatus());

        messages = jsonContext.parse(grantedPublish.getResponseContent());
        Assert.assertEquals(1, messages.length);
        message = messages[0];
        Assert.assertFalse(message.isSuccessful());
    }
}
