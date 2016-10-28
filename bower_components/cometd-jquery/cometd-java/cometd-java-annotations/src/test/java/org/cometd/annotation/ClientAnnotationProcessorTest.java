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

package org.cometd.annotation;

import java.util.HashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.inject.Inject;

import org.cometd.bayeux.Channel;
import org.cometd.bayeux.Message;
import org.cometd.bayeux.client.ClientSession;
import org.cometd.bayeux.client.ClientSessionChannel;
import org.cometd.client.BayeuxClient;
import org.cometd.client.transport.LongPollingTransport;
import org.cometd.server.CometdServlet;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.nio.SelectChannelConnector;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

public class ClientAnnotationProcessorTest
{
    private static Server server;
    private static String cometdURL;
    private static HttpClient httpClient;
    private BayeuxClient bayeuxClient;
    private ClientAnnotationProcessor processor;

    @BeforeClass
    public static void startServer() throws Exception
    {
        server = new Server();

        Connector connector = new SelectChannelConnector();
        connector.setMaxIdleTime(30000);
        server.addConnector(connector);

        String contextPath = "";
        ServletContextHandler context = new ServletContextHandler(server, contextPath);

        // Cometd servlet
        ServletHolder cometdServletHolder = new ServletHolder(CometdServlet.class);
        cometdServletHolder.setInitParameter("timeout", "10000");
        cometdServletHolder.setInitParameter("multiFrameInterval", "2000");
        if (Boolean.getBoolean("debugTests"))
            cometdServletHolder.setInitParameter("logLevel", "3");
        cometdServletHolder.setInitOrder(1);

        String cometdServletPath = "/cometd";
        context.addServlet(cometdServletHolder, cometdServletPath + "/*");

        server.start();
        int port = connector.getLocalPort();
        cometdURL = "http://localhost:" + port + contextPath + cometdServletPath;

        httpClient = new HttpClient();
        httpClient.start();

    }

    @AfterClass
    public static void stopServer() throws Exception
    {
        httpClient.stop();

        server.stop();
        server.join();
    }

    @Before
    public void init()
    {
        bayeuxClient = new BayeuxClient(cometdURL, LongPollingTransport.create(null, httpClient));
        bayeuxClient.setDebugEnabled(Boolean.getBoolean("debugTests"));
        processor = new ClientAnnotationProcessor(bayeuxClient);
    }

    @After
    public void destroy()
    {
        bayeuxClient.disconnect(1000);
    }

    @Test
    public void testNull() throws Exception
    {
        boolean processed = processor.process(null);
        assertFalse(processed);
    }

    @Test
    public void testNonServiceAnnotatedClass() throws Exception
    {
        NonServiceAnnotatedService s = new NonServiceAnnotatedService();
        boolean processed = processor.process(s);
        assertFalse(processed);
        assertNull(s.session);
    }

    public static class NonServiceAnnotatedService
    {
        @Session
        private ClientSession session;
    }

    @Test
    public void testInjectClientSessionOnField() throws Exception
    {
        InjectClientSessionOnFieldService s = new InjectClientSessionOnFieldService();
        boolean processed = processor.process(s);
        assertTrue(processed);
        assertNotNull(s.session);
    }

    @Service
    public static class InjectClientSessionOnFieldService
    {
        @Session
        private ClientSession session;
    }

    @Test
    public void testInjectClientSessionOnMethod() throws Exception
    {
        InjectClientSessionOnMethodService s = new InjectClientSessionOnMethodService();
        boolean processed = processor.process(s);
        assertTrue(processed);
        assertNotNull(s.session);
    }

    @Service
    public static class InjectClientSessionOnMethodService
    {
        private ClientSession session;

        @Session
        private void set(ClientSession session)
        {
            this.session = session;
        }
    }

    @Test
    public void testListenUnlisten() throws Exception
    {
        final AtomicReference<Message> handshakeRef = new AtomicReference<Message>();
        final CountDownLatch handshakeLatch = new CountDownLatch(1);
        final AtomicReference<Message> connectRef = new AtomicReference<Message>();
        final CountDownLatch connectLatch = new CountDownLatch(1);
        final AtomicReference<Message> disconnectRef = new AtomicReference<Message>();
        final CountDownLatch disconnectLatch = new CountDownLatch(1);

        ListenUnlistenService s = new ListenUnlistenService(handshakeRef, handshakeLatch, connectRef, connectLatch, disconnectRef, disconnectLatch);
        boolean processed = processor.process(s);
        assertTrue(processed);

        bayeuxClient.handshake();
        assertTrue(handshakeLatch.await(5, TimeUnit.SECONDS));
        Message handshake = handshakeRef.get();
        assertNotNull(handshake);
        assertTrue(handshake.isSuccessful());

        assertTrue(connectLatch.await(5, TimeUnit.SECONDS));
        Message connect = connectRef.get();
        assertNotNull(connect);
        assertTrue(connect.isSuccessful());

        processed = processor.deprocessCallbacks(s);
        assertTrue(processed);

        // Listener method must not be notified, since we have deconfigured
        bayeuxClient.disconnect(1000);
    }

    @Service
    public static class ListenUnlistenService
    {
        private final AtomicReference<Message> handshakeRef;
        private final CountDownLatch handshakeLatch;
        private final AtomicReference<Message> connectRef;
        private final CountDownLatch connectLatch;
        private final AtomicReference<Message> disconnectRef;
        private final CountDownLatch disconnectLatch;

        public ListenUnlistenService(AtomicReference<Message> handshakeRef, CountDownLatch handshakeLatch, AtomicReference<Message> connectRef, CountDownLatch connectLatch, AtomicReference<Message> disconnectRef, CountDownLatch disconnectLatch)
        {

            this.handshakeRef = handshakeRef;
            this.handshakeLatch = handshakeLatch;
            this.connectRef = connectRef;
            this.connectLatch = connectLatch;
            this.disconnectRef = disconnectRef;
            this.disconnectLatch = disconnectLatch;
        }

        @Listener(Channel.META_HANDSHAKE)
        public void metaHandshake(Message handshake)
        {
            handshakeRef.set(handshake);
            handshakeLatch.countDown();
        }

        @Listener(Channel.META_CONNECT)
        public void metaConnect(Message connect)
        {
            connectRef.set(connect);
            connectLatch.countDown();
        }

        @Listener(Channel.META_DISCONNECT)
        public void metaDisconnect(Message connect)
        {
            disconnectRef.set(connect);
            disconnectLatch.countDown();
        }
    }

    @Test
    public void testSubscribeUnsubscribe() throws Exception
    {
        final AtomicReference<Message> messageRef = new AtomicReference<Message>();
        final AtomicReference<CountDownLatch> messageLatch = new AtomicReference<CountDownLatch>(new CountDownLatch(1));

        SubscribeUnsubscribeService s = new SubscribeUnsubscribeService(messageRef, messageLatch);
        boolean processed = processor.process(s);
        assertTrue(processed);

        final CountDownLatch subscribeLatch = new CountDownLatch(1);
        bayeuxClient.getChannel(Channel.META_SUBSCRIBE).addListener(new ClientSessionChannel.MessageListener()
        {
            public void onMessage(ClientSessionChannel channel, Message message)
            {
                subscribeLatch.countDown();
            }
        });

        bayeuxClient.handshake();
        assertTrue(bayeuxClient.waitFor(5000, BayeuxClient.State.CONNECTED));
        assertTrue(subscribeLatch.await(5, TimeUnit.SECONDS));

        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertTrue(messageLatch.get().await(5, TimeUnit.SECONDS));

        final CountDownLatch unsubscribeLatch = new CountDownLatch(1);
        bayeuxClient.getChannel(Channel.META_UNSUBSCRIBE).addListener(new ClientSessionChannel.MessageListener()
        {
            public void onMessage(ClientSessionChannel channel, Message message)
            {
                unsubscribeLatch.countDown();
            }
        });

        processor.deprocessCallbacks(s);
        assertTrue(unsubscribeLatch.await(5, TimeUnit.SECONDS));

        messageLatch.set(new CountDownLatch(1));

        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertFalse(messageLatch.get().await(1, TimeUnit.SECONDS));
    }

    @Service
    public static class SubscribeUnsubscribeService
    {
        private final AtomicReference<Message> messageRef;
        private final AtomicReference<CountDownLatch> messageLatch;

        public SubscribeUnsubscribeService(AtomicReference<Message> messageRef, AtomicReference<CountDownLatch> messageLatch)
        {
            this.messageRef = messageRef;
            this.messageLatch = messageLatch;
        }

        @Subscription("/foo")
        public void foo(Message message)
        {
            messageRef.set(message);
            messageLatch.get().countDown();
        }
    }

    @Test
    public void testUsage() throws Exception
    {
        final CountDownLatch connectLatch = new CountDownLatch(1);
        final AtomicReference<CountDownLatch> messageLatch = new AtomicReference<CountDownLatch>();

        UsageService s = new UsageService(connectLatch, messageLatch);
        processor.process(s);
        assertTrue(s.initialized);
        assertFalse(s.connected);

        final CountDownLatch subscribeLatch = new CountDownLatch(1);
        bayeuxClient.getChannel(Channel.META_SUBSCRIBE).addListener(new ClientSessionChannel.MessageListener()
        {
            public void onMessage(ClientSessionChannel channel, Message message)
            {
                subscribeLatch.countDown();
            }
        });

        bayeuxClient.handshake();
        assertTrue(connectLatch.await(5, TimeUnit.SECONDS));
        assertTrue(s.connected);
        assertTrue(subscribeLatch.await(5, TimeUnit.SECONDS));

        messageLatch.set(new CountDownLatch(1));
        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertTrue(messageLatch.get().await(5, TimeUnit.SECONDS));

        processor.deprocess(s);
        assertFalse(s.initialized);

        messageLatch.set(new CountDownLatch(1));
        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertFalse(messageLatch.get().await(1, TimeUnit.SECONDS));
    }

    @Service
    public static class UsageService
    {
        private final CountDownLatch connectLatch;
        private final AtomicReference<CountDownLatch> messageLatch;
        private boolean initialized;
        private boolean connected;
        @Session
        private ClientSession session;

        public UsageService(CountDownLatch connectLatch, AtomicReference<CountDownLatch> messageLatch)
        {
            this.connectLatch = connectLatch;
            this.messageLatch = messageLatch;
        }

        @PostConstruct
        private void init()
        {
            initialized = true;
        }

        @PreDestroy
        private void destroy()
        {
            initialized = false;
        }

        @Listener(Channel.META_CONNECT)
        public void metaConnect(Message connect)
        {
            connected = connect.isSuccessful();
            connectLatch.countDown();
        }

        @Subscription("/foo")
        public void foo(Message message)
        {
            messageLatch.get().countDown();
        }
    }

    @Test
    public void testInjectables() throws Exception
    {
        Injectable i = new DerivedInjectable();
        InjectablesService s = new InjectablesService();
        processor = new ClientAnnotationProcessor(bayeuxClient, i);
        boolean processed = processor.process(s);
        assertTrue(processed);

        assertSame(i, s.i);
    }

    class Injectable
    {
    }

    class DerivedInjectable extends Injectable
    {
    }

    @Service
    public static class InjectablesService
    {
        @Inject
        private Injectable i;
    }

    @Test
    public void testResubscribeOnRehandshake() throws Exception
    {
        AtomicReference<CountDownLatch> messageLatch = new AtomicReference<CountDownLatch>();
        ResubscribeOnRehandshakeService s = new ResubscribeOnRehandshakeService(messageLatch);
        boolean processed = processor.process(s);
        assertTrue(processed);

        final CountDownLatch subscribeLatch = new CountDownLatch(1);
        bayeuxClient.getChannel(Channel.META_SUBSCRIBE).addListener(new ClientSessionChannel.MessageListener()
        {
            public void onMessage(ClientSessionChannel channel, Message message)
            {
                subscribeLatch.countDown();
            }
        });

        bayeuxClient.handshake();
        assertTrue(bayeuxClient.waitFor(1000, BayeuxClient.State.CONNECTED));
        assertTrue(subscribeLatch.await(5, TimeUnit.SECONDS));

        messageLatch.set(new CountDownLatch(1));
        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertTrue(messageLatch.get().await(5, TimeUnit.SECONDS));

        bayeuxClient.disconnect();
        assertTrue(bayeuxClient.waitFor(1000, BayeuxClient.State.DISCONNECTED));

        // Rehandshake
        bayeuxClient.handshake();
        assertTrue(bayeuxClient.waitFor(1000, BayeuxClient.State.CONNECTED));

        // Republish, it must have resubscribed
        messageLatch.set(new CountDownLatch(1));
        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertTrue(messageLatch.get().await(5, TimeUnit.SECONDS));

        bayeuxClient.disconnect();
        assertTrue(bayeuxClient.waitFor(1000, BayeuxClient.State.DISCONNECTED));

        boolean deprocessed = processor.deprocess(s);
        assertTrue(deprocessed);

        // Rehandshake
        bayeuxClient.handshake();
        assertTrue(bayeuxClient.waitFor(1000, BayeuxClient.State.CONNECTED));

        // Republish, it must not have resubscribed
        messageLatch.set(new CountDownLatch(1));
        bayeuxClient.getChannel("/foo").publish(new HashMap());
        assertFalse(messageLatch.get().await(1, TimeUnit.SECONDS));
    }

    @Service
    public static class ResubscribeOnRehandshakeService
    {
        private final AtomicReference<CountDownLatch> messageLatch;

        public ResubscribeOnRehandshakeService(AtomicReference<CountDownLatch> messageLatch)
        {
            this.messageLatch = messageLatch;
        }

        @Subscription("/foo")
        public void foo(Message message)
        {
            if (message.getData() != null)
                messageLatch.get().countDown();
        }
    }
}
