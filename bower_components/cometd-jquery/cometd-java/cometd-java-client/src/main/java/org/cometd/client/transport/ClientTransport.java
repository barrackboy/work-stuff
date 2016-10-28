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

package org.cometd.client.transport;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.cometd.bayeux.Message;
import org.cometd.common.AbstractTransport;
import org.cometd.common.JSONContext;
import org.cometd.common.JettyJSONContextClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * {@link ClientTransport}s are used by {@link org.cometd.client.BayeuxClient} to send and receive Bayeux messages.
 */
public abstract class ClientTransport extends AbstractTransport
{
    public static final String TIMEOUT_OPTION = "timeout";
    public static final String INTERVAL_OPTION = "interval";
    public static final String MAX_NETWORK_DELAY_OPTION = "maxNetworkDelay";
    public static final String JSON_CONTEXT = "jsonContext";

    protected final Logger logger = LoggerFactory.getLogger(getClass().getName() + "." + System.identityHashCode(this));
    private boolean debug;
    private JSONContext.Client jsonContext;

    protected ClientTransport(String name, Map<String, Object> options)
    {
        super(name, options);
    }

    /**
     * Initializes this transport, usually by reading/defaulting parameters used by the transport
     * from the options passed to the constructor.
     */
    public void init()
    {
        jsonContext = (JSONContext.Client)getOption(JSON_CONTEXT);
        if (jsonContext == null)
            jsonContext = new JettyJSONContextClient();
    }

    /**
     * Aborts this transport, usually by cancelling all pending Bayeux messages that require a response,
     * such as {@code /meta/connect}s, without waiting for a response.
     *
     * @see {@link org.cometd.client.BayeuxClient#abort()}
     */
    public abstract void abort();

    /**
     * Terminates this transport, usually by closing network connections opened directly by this transport.
     *
     * @see {@link org.cometd.client.BayeuxClient#disconnect()}
     */
    public void terminate()
    {
    }

    public boolean isDebugEnabled()
    {
        return debug;
    }

    public void setDebugEnabled(boolean enabled)
    {
        this.debug = enabled;
    }

    protected void debug(String message, Object... args)
    {
        if (isDebugEnabled())
            logger.info(message, args);
        else
            logger.debug(message, args);
    }

    public abstract boolean accept(String version);

    public abstract void send(TransportListener listener, Message.Mutable... messages);

    protected List<Message.Mutable> parseMessages(String content) throws ParseException
    {
        return new ArrayList<Message.Mutable>(Arrays.asList(jsonContext.parse(content)));
    }

    protected String generateJSON(Message.Mutable[] messages)
    {
        return jsonContext.generate(messages);
    }
}
