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

package org.cometd.javascript;

import java.io.EOFException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.concurrent.TimeoutException;

import org.eclipse.jetty.client.ContentExchange;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.HttpExchange;
import org.eclipse.jetty.http.HttpHeaders;
import org.eclipse.jetty.io.Buffer;
import org.eclipse.jetty.io.ByteArrayBuffer;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class XMLHttpRequestExchange extends ScriptableObject
{
    private CometDExchange exchange;

    public XMLHttpRequestExchange()
    {
    }

    public void jsConstructor(Object cookieStore, Object threadModel, Scriptable thiz, String method, String url, boolean async)
    {
        exchange = new CometDExchange((HttpCookieStore)cookieStore, (ThreadModel)threadModel, thiz, method, url, async);
    }

    public String getClassName()
    {
        return "XMLHttpRequestExchange";
    }

    public HttpExchange getHttpExchange()
    {
        return exchange;
    }

    public boolean isAsynchronous()
    {
        return exchange.isAsynchronous();
    }

    public void await() throws Exception
    {
        if (exchange.waitForDone() == HttpExchange.STATUS_COMPLETED)
            exchange.notifyReadyStateChange(false);
        else
            exchange.rethrow();
    }

    public void jsFunction_addRequestHeader(String name, String value)
    {
        exchange.addRequestHeader(name, value);
    }

    public String jsGet_method()
    {
        return exchange.getMethod();
    }

    public void jsFunction_setRequestContent(String data) throws UnsupportedEncodingException
    {
        exchange.setRequestContent(data);
    }

    public int jsGet_readyState()
    {
        return exchange.getReadyState();
    }

    public String jsGet_responseText()
    {
        return exchange.getResponseText();
    }

    public int jsGet_responseStatus()
    {
        return exchange.getResponseStatus();
    }

    public String jsGet_responseStatusText()
    {
        return exchange.getResponseStatusText();
    }

    public void jsFunction_abort()
    {
        exchange.cancel();
    }

    public String jsFunction_getAllResponseHeaders()
    {
        return exchange.getAllResponseHeaders();
    }

    public String jsFunction_getResponseHeader(String name)
    {
        return exchange.getResponseHeader(name);
    }

    public void send(HttpClient httpClient) throws Exception
    {
        exchange.send(httpClient);
    }

    public static class CometDExchange extends ContentExchange
    {
        public enum ReadyState
        {
            UNSENT, OPENED, HEADERS_RECEIVED, LOADING, DONE
        }

        private final Logger logger = LoggerFactory.getLogger(getClass().getName());
        private final HttpCookieStore cookieStore;
        private final ThreadModel threads;
        private final Scriptable thiz;
        private final boolean async;
        private volatile boolean aborted;
        private volatile ReadyState readyState = ReadyState.UNSENT;
        private volatile String responseText;
        private volatile String responseStatusText;
        private volatile Throwable failure;

        public CometDExchange(HttpCookieStore cookieStore, ThreadModel threads, Scriptable thiz, String method, String url, boolean async)
        {
            super(true);
            this.cookieStore = cookieStore;
            this.threads = threads;
            this.thiz = thiz;
            setMethod(method == null ? "GET" : method.toUpperCase());
            setURL(url);
            this.async = async;
            aborted = false;
            readyState = ReadyState.OPENED;
            responseStatusText = null;
            getRequestFields().clear();
            if (async)
                notifyReadyStateChange(false);
        }

        public boolean isAsynchronous()
        {
            return async;
        }

        /**
         * If this method is invoked in the same stack of a JavaScript call,
         * then it must be asynchronous.
         * The reason is that the JavaScript may modify the onreadystatechange
         * function afterwards, and we would be notifying the wrong function.
         *
         * @param sync whether the call should be synchronous
         */
        private void notifyReadyStateChange(boolean sync)
        {
            threads.invoke(sync, thiz, thiz, "onreadystatechange");
        }

        public void send(HttpClient httpClient) throws Exception
        {
            String cookies = cookieStore.jsFunction_get(getScheme().toString("UTF-8"), getAddress().toString(), "");
            if (cookies.length() > 0)
                setRequestHeader(HttpHeaders.COOKIE, cookies);
            log("Submitted {}", this);
            httpClient.send(this);
        }

        @Override
        public void cancel()
        {
            super.cancel();
            log("Aborted {}", this);
            aborted = true;
            responseText = null;
            getRequestFields().clear();
            if (!async || readyState == ReadyState.HEADERS_RECEIVED || readyState == ReadyState.LOADING)
            {
                readyState = ReadyState.DONE;
                notifyReadyStateChange(false);
            }
            readyState = ReadyState.UNSENT;
        }

        public int getReadyState()
        {
            return readyState.ordinal();
        }

        public String getResponseText()
        {
            return responseText;
        }

        public String getResponseStatusText()
        {
            return responseStatusText;
        }

        public void setRequestContent(String content) throws UnsupportedEncodingException
        {
            setRequestContent(new ByteArrayBuffer(content, "UTF-8"));
        }

        public String getAllResponseHeaders()
        {
            return getResponseFields().toString();
        }

        public String getResponseHeader(String name)
        {
            return getResponseFields().getStringField(name);
        }

        @Override
        protected void onResponseStatus(Buffer version, int status, Buffer statusText) throws IOException
        {
            super.onResponseStatus(version, status, statusText);
            this.responseStatusText = new String(statusText.asArray(), "UTF-8");
        }

        @Override
        protected void onResponseHeader(Buffer name, Buffer value) throws IOException
        {
            super.onResponseHeader(name, value);
            int headerName = HttpHeaders.CACHE.getOrdinal(name);
            if (headerName == HttpHeaders.SET_COOKIE_ORDINAL)
            {
                try
                {
                    cookieStore.jsFunction_set(getScheme().toString("UTF-8"), getAddress().toString(), "", value.toString("UTF-8"));
                }
                catch (Exception x)
                {
                    throw (IOException)new IOException().initCause(x);
                }
            }
        }

        @Override
        protected void onResponseHeaderComplete() throws IOException
        {
            if (!aborted)
            {
                if (async)
                {
                    readyState = ReadyState.HEADERS_RECEIVED;
                    notifyReadyStateChange(true);
                }
            }
        }

        @Override
        protected void onResponseContent(Buffer buffer) throws IOException
        {
            super.onResponseContent(buffer);
            if (!aborted)
            {
                if (async)
                {
                    if (readyState != ReadyState.LOADING)
                    {
                        readyState = ReadyState.LOADING;
                        notifyReadyStateChange(true);
                    }
                }
            }
        }

        @Override
        protected void onResponseComplete() throws IOException
        {
            if (!aborted)
            {
                log("Completed ({}) {}", getResponseStatus(), this);
                responseText = getResponseContent();
                readyState = ReadyState.DONE;
                if (async)
                    notifyReadyStateChange(true);
            }
        }

        @Override
        protected void onConnectionFailed(Throwable x)
        {
            super.onConnectionFailed(x);
            fail(x);
        }

        @Override
        protected void onException(Throwable x)
        {
            if (!(x instanceof EOFException))
                super.onException(x);
            fail(x);
        }

        @Override
        protected void onExpire()
        {
            super.onExpire();
            fail(new TimeoutException());
        }

        private void fail(Throwable x)
        {
            failure = x;
            log("Failed: {}", x);
            if (async)
            {
                readyState = ReadyState.DONE;
                notifyReadyStateChange(true);
            }
        }

        public void rethrow() throws Exception
        {
            if (failure instanceof Exception)
                throw (Exception)failure;
            if (failure instanceof Error)
                throw (Error)failure;
        }

        @Override
        protected void onRequestCommitted() throws IOException
        {
            super.onRequestCommitted();
            log("Committed {}", this);
        }

        @Override
        protected void onRequestComplete() throws IOException
        {
            super.onRequestComplete();
            log("Sent {}", this);
        }

        private void log(String message, Object... args)
        {
            if (Boolean.getBoolean("debugTests"))
                logger.info(message, args);
            else
                logger.debug(message, args);
        }
    }
}
