package io.jenkins.blueocean.service.embedded.rest;

import com.google.common.base.Charsets;
import com.google.common.base.Predicate;
import com.google.common.base.Predicates;
import com.google.common.base.Supplier;
import com.google.common.base.Suppliers;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.Iterables;
import com.google.common.io.Resources;
import hudson.model.Action;
import io.jenkins.blueocean.rest.Reachable;
import io.jenkins.blueocean.rest.hal.Link;
import io.jenkins.blueocean.rest.model.BlueActionProxy;
import org.kohsuke.stapler.export.ExportedBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * @author Vivek Pandey
 */
public class ActionProxiesImpl extends BlueActionProxy {
    private final Action action;
    private final Reachable parent;
    private static final Logger logger = LoggerFactory.getLogger(ActionProxiesImpl.class);

    public ActionProxiesImpl(Action action, Reachable parent) {
        this.action = action;
        this.parent = parent;
    }


    @Override
    public Object getAction() {
        if(action.getClass().isAnnotationPresent(ExportedBean.class)){
            return action;
        }else{
            return null;
        }
    }

    @Override
    public String getUrlName() {
        try {
            return action.getUrlName();
        }catch (Exception e){
            logger.error(String.format("Error calling %s.getUrlName(): %s", action.getClass().getName(), e.getMessage()),e);
            return null;
        }
    }

    @Override
    public String get_Class() {
        return action.getClass().getName();
    }

    @Override
    public Link getLink() {
        if(getUrlName() != null) {
            return parent.getLink().rel(getUrlName());
        }
        return null;
    }

    public static Collection<BlueActionProxy> getActionProxies(List<? extends Action> actions, Reachable parent){
        List<BlueActionProxy> actionProxies = new ArrayList<>();
        for(Action action : Iterables.filter(actions, NOT_BANNED)){
            if(action == null){
                continue;
            }
            actionProxies.add(new ActionProxiesImpl(action, parent));
        }
        return actionProxies;

    }

    private static final Supplier<ImmutableList<String>> BANNED_ACTIONS = Suppliers.memoize(new Supplier<ImmutableList<String>>() {
        @Override
        public ImmutableList<String> get() {
            URL url = ActionProxiesImpl.class.getClassLoader().getResource("io.jenkins.blueocean.service.embedded/banned_actions.txt");
            assert url != null;
            try {
                return ImmutableList.copyOf(Resources.readLines(url, Charsets.UTF_8));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    });

    private static final Predicate<Action> NOT_BANNED = new Predicate<Action>() {
        @Override
        public boolean apply(Action action) {
            return !BANNED_ACTIONS.get().contains(action.getClass().getName());
        }
    };
}
